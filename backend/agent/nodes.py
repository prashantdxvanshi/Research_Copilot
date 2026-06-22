import json
import os
import logging
from typing import List
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from duckduckgo_search import DDGS
from .state import ResearchState

"""
agent/nodes.py
This file defines the functions (nodes) that execute tasks in the Research Copilot LangGraph.
Each node represents a distinct step in the research pipeline:
1. planner_node: Determines the research strategy by generating search queries.
2. researcher_node: Gathers information by executing queries using DuckDuckGo.
3. report_generator_node: Synthesizes research into a structured business briefing.
4. quality_check_node: Evaluates the report to ensure it is complete and high-quality.
"""

logger = logging.getLogger(__name__)


def update_step(session_id: str, step_name: str):
    """
    Utility function to update the user-facing status of a session in MongoDB.
    This enables real-time progress indicators on the frontend.
    """
    try:
        from database import db as mongo_db
        mongo_db.sessions.update_one({"_id": session_id}, {"$set": {"current_step": step_name}})
        logger.info(f"[workflow] Updated current step to: {step_name}")
    except Exception as e:
        logger.warning(f"Failed to update step in DB: {e}")



# ─────────────────────────────────────────────
# Pydantic Schemas for Structured LLM Output
# ─────────────────────────────────────────────

class SearchQueries(BaseModel):
    """A set of search queries for the researcher node."""
    queries: List[str] = Field(
        description="A list of 3 specific, focused search queries to research the company"
    )

class ResearchReport(BaseModel):
    """The final structured research briefing report."""
    company_overview: str = Field(description="A 2-3 sentence overview of what the company does")
    products_and_services: str = Field(description="Key products or services offered by the company")
    target_customers: str = Field(description="The primary customer segments or industries served")
    business_signals: str = Field(description="Recent news, funding, hiring trends, or growth signals")
    risks_and_challenges: str = Field(description="Known risks, competitive threats, or business challenges")
    suggested_discovery_questions: str = Field(description="3-5 discovery questions to ask in a sales meeting")
    suggested_outreach_strategy: str = Field(description="A recommended strategy for outreach or engagement")
    unknowns: str = Field(description="Information that could not be found or gaps in the research")
    sources: str = Field(description="List of sources or search queries that were used for this report")


# ─────────────────────────────────────────────
# LLM Factory
# ─────────────────────────────────────────────

def get_llm():
    """
    Returns a ChatOpenAI instance configured to use the local Ollama server.
    Falls back to OpenAI if LLM_BASE_URL is not set.
    """
    base_url = os.getenv("LLM_BASE_URL")
    model = os.getenv("LLM_MODEL", "llama3.2:1b")
    api_key = os.getenv("OPENAI_API_KEY", "ollama")

    if base_url:
        logger.info(f"Using local LLM via Ollama: model={model}, base_url={base_url}")
        return ChatOpenAI(
            model=model,
            temperature=0,
            base_url=base_url,
            api_key=api_key
        )
    logger.info("Using OpenAI LLM (no LLM_BASE_URL set)")
    return ChatOpenAI(model=model, temperature=0)


def _build_field_prompt(pydantic_model) -> str:
    """
    Build a concrete example-based JSON prompt from Pydantic field descriptions.
    Avoids dumping the raw JSON Schema (which confuses small models).
    """
    fields = pydantic_model.model_fields
    lines = ["Fill in the following JSON object with real content. Output ONLY the JSON, no extra text:\n{"]
    field_items = list(fields.items())
    for i, (name, field_info) in enumerate(field_items):
        desc = field_info.description or name
        comma = "," if i < len(field_items) - 1 else ""
        lines.append(f'  "{name}": "<{desc}>"{comma}')
    lines.append("}")
    return "\n".join(lines)


def _is_schema_echo(parsed: dict, pydantic_model) -> bool:
    """
    Detect if the model returned the JSON Schema itself instead of filled data.
    This happens when the parsed JSON contains 'properties' or 'type'=='object'
    but none of the actual model field names.
    """
    model_fields = set(pydantic_model.model_fields.keys())
    parsed_keys = set(parsed.keys())
    # If none of the actual field names are present, it's likely a schema echo
    return len(model_fields & parsed_keys) == 0


def invoke_structured(llm, prompt: str, pydantic_model):
    """
    Attempts to get structured output from the LLM using Pydantic.
    Strategy:
      1. Try native with_structured_output (best, works on GPT-4 / capable models).
      2. Fall back to field-by-field example prompt + JSON extraction.
      3. If the model echoed the schema back, raise a clear error so callers can use their own fallback.
    """
    # ── Attempt 1: native structured output ──────────────────────────────────
    try:
        structured_llm = llm.with_structured_output(pydantic_model)
        result = structured_llm.invoke([HumanMessage(content=prompt)])
        if result is not None:
            return result
    except Exception as e:
        logger.warning(f"Native structured output failed, trying field-prompt fallback: {e}")

    # ── Attempt 2: field-by-field example prompt (avoids schema confusion) ───
    field_template = _build_field_prompt(pydantic_model)
    json_prompt = (
        f"{prompt}\n\n"
        "---\n"
        "Your response must be ONLY a valid JSON object with the exact keys shown below. "
        "Do NOT output any explanations, markdown code fences, or the schema definition. "
        "Replace each placeholder with real content based on the context above.\n\n"
        f"{field_template}"
    )

    try:
        response = llm.invoke([HumanMessage(content=json_prompt)])
        content = response.content.strip()

        # Strip markdown code fences if present
        json_str = content
        if json_str.startswith("```"):
            lines = json_str.splitlines()
            # Remove opening fence (```json or ```)
            lines = lines[1:]
            # Remove closing fence
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            json_str = "\n".join(lines).strip()

        # Extract the JSON object substring
        start = json_str.find('{')
        end = json_str.rfind('}')
        if start != -1 and end != -1 and end > start:
            json_str = json_str[start:end + 1]

        parsed = json.loads(json_str)

        # Guard: if the model echoed the schema itself, reject it
        if _is_schema_echo(parsed, pydantic_model):
            raise ValueError(
                "Model returned the JSON schema definition instead of filled data. "
                f"Got keys: {list(parsed.keys())}"
            )

        return pydantic_model.model_validate(parsed)

    except Exception as json_err:
        logger.error(f"Field-prompt fallback failed: {json_err}. Raw content snippet: {content[:300] if 'content' in dir() else 'N/A'}")
        raise json_err


# ─────────────────────────────────────────────
# LangGraph Nodes
# ─────────────────────────────────────────────

def planner_node(state: ResearchState) -> dict:
    """
    Plans the research by generating targeted search queries.
    Uses structured output (Pydantic) to ensure well-formed query lists.
    """
    logger.info(f"[planner_node] Planning research for: {state['company_name']}")
    update_step(state['session_id'], "Planning search queries")
    llm = get_llm()

    prompt = f"""You are an expert research planner.

Company Name: {state['company_name']}
Website: {state['website']}
Objective: {state['objective']}

Generate exactly 3 specific search queries for business intelligence on this company.
Focus on: recent news, products/services, customers, and competitive landscape.

Respond with ONLY a JSON object like this (no other text):
{{"queries": ["query one here", "query two here", "query three here"]}}"""

    try:
        result: SearchQueries = invoke_structured(llm, prompt, SearchQueries)
        queries = result.queries[:3]  # Cap at 3
        logger.info(f"[planner_node] Generated {len(queries)} search queries")
        return {
            "search_queries": queries,
            "plan": [f"Generated {len(queries)} research queries"]
        }
    except Exception as e:
        logger.error(f"[planner_node] Structured output failed, using fallback: {e}")
        # Graceful fallback: build a basic query from the company name
        fallback_queries = [
            f"{state['company_name']} company overview products",
            f"{state['company_name']} customers target market",
            f"{state['company_name']} news challenges 2024"
        ]
        return {
            "search_queries": fallback_queries,
            "plan": ["Fallback: used default query structure due to planner error"],
            "errors": state.get("errors", []) + [f"Planner structured output error: {str(e)}"]
        }


def researcher_node(state: ResearchState) -> dict:
    """
    Executes web searches using DuckDuckGo for each planned search query.
    Handles rate limits and search failures gracefully.
    """
    queries = state.get("search_queries", [])
    logger.info(f"[researcher_node] Running {len(queries)} search queries")
    update_step(state['session_id'], "Executing web searches")
    results = []

    try:
        with DDGS() as ddgs:
            for q in queries:
                try:
                    res = list(ddgs.text(q, max_results=4))
                    results.extend(res)
                    logger.debug(f"[researcher_node] Query '{q}' returned {len(res)} results")
                except Exception as inner_e:
                    logger.warning(f"[researcher_node] Query failed: '{q}' – {inner_e}")
    except Exception as e:
        logger.error(f"[researcher_node] DuckDuckGo search session failed: {e}")
        return {
            "research_results": results,
            "errors": state.get("errors", []) + [f"Researcher error: {str(e)}"]
        }

    logger.info(f"[researcher_node] Collected {len(results)} total research results")
    return {"research_results": results}


def report_generator_node(state: ResearchState) -> dict:
    """
    Synthesizes gathered research results into a structured business briefing.
    Uses Pydantic structured output to guarantee all report fields are populated.
    """
    logger.info(f"[report_generator_node] Generating report for: {state['company_name']}")
    update_step(state['session_id'], "Synthesizing research report")
    llm = get_llm()

    research_results = state.get("research_results", [])
    if not research_results:
        logger.warning("[report_generator_node] No research results available, generating from prior knowledge")

    context_parts = []
    for r in research_results:
        title = r.get("title", "")
        body = r.get("body", "")
        href = r.get("href", "")
        if title or body:
            context_parts.append(f"- [{title}]({href}): {body}")
    context = "\n".join(context_parts) if context_parts else "No web research data available."

    prompt = f"""You are an expert business analyst preparing a sales briefing document.

Company Name: {state['company_name']}
Website: {state['website']}
Research Objective: {state['objective']}

Web Research Gathered:
{context}

Using the information above (and your own knowledge where research is limited), generate a comprehensive, structured business briefing report. Be specific, concise, and actionable. Avoid generic filler."""

    try:
        result: ResearchReport = invoke_structured(llm, prompt, ResearchReport)

        # Convert to serializable dict with human-readable keys
        report = {
            "Company Overview": result.company_overview,
            "Products & Services": result.products_and_services,
            "Target Customers": result.target_customers,
            "Business Signals": result.business_signals,
            "Risks & Challenges": result.risks_and_challenges,
            "Suggested Discovery Questions": result.suggested_discovery_questions,
            "Suggested Outreach Strategy": result.suggested_outreach_strategy,
            "Unknowns": result.unknowns,
            "Sources": result.sources
        }
        logger.info("[report_generator_node] Report generated successfully via structured output")
        return {"report": report}

    except Exception as e:
        logger.error(f"[report_generator_node] Structured output failed: {e}", exc_info=True)
        return {
            "errors": state.get("errors", []) + [f"Report generation error: {str(e)}"]
        }


def quality_check_node(state: ResearchState) -> dict:
    """
    Validates that the generated report contains all required sections.
    If it fails (and revision_count < 2), routes back to researcher for a retry.
    """
    report = state.get("report")
    revision_count = state.get("revision_count", 0)
    logger.info(f"[quality_check_node] Checking report quality (revision_count={revision_count})")
    update_step(state['session_id'], f"Running quality check (revision {revision_count + 1})")

    required_keys = [
        "Company Overview", "Products & Services", "Target Customers",
        "Business Signals", "Risks & Challenges", "Suggested Discovery Questions",
        "Suggested Outreach Strategy", "Unknowns", "Sources"
    ]

    if not report:
        logger.warning("[quality_check_node] No report found, flagging for retry")
        return {"quality_passed": False, "revision_count": revision_count + 1}

    missing_keys = [k for k in required_keys if k not in report or not str(report[k]).strip()]

    if missing_keys:
        logger.warning(f"[quality_check_node] Report missing keys: {missing_keys}")
        if revision_count < 2:
            return {
                "quality_passed": False,
                "revision_count": revision_count + 1,
                "errors": state.get("errors", []) + [f"Quality check failed – missing: {missing_keys}"]
            }
        # Max retries reached, accept the partial report
        logger.warning("[quality_check_node] Max revisions reached, accepting partial report")

    logger.info("[quality_check_node] Report passed quality check")
    return {"quality_passed": True, "revision_count": revision_count + 1}
