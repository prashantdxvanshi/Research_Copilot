from typing import TypedDict, List, Dict, Any, Optional

class ResearchState(TypedDict):
    """
    ResearchState defines the schema of the shared memory/state inside the LangGraph workflow.
    Every node in the graph reads from this state, performs its action, and returns updates
    which are automatically merged back into the state.
    """
    # 1. Inputs provided when the workflow is started
    session_id: str
    company_name: str
    website: str
    objective: str
    
    # 2. Intermediate state variables accumulated during execution
    plan: List[str]                            # List of plan steps or logs
    search_queries: List[str]                  # The generated DuckDuckGo search queries
    research_results: List[Dict[str, Any]]     # Collected search results (snippets, links, titles)
    
    # 3. Outputs produced by the workflow
    report: Optional[Dict[str, Any]]           # The final generated business report
    errors: List[str]                          # Any errors encountered during execution
    
    # 4. Control variables used by the quality controller
    revision_count: int                        # Number of research revision cycles completed
    quality_passed: bool                       # True if the generated report meets quality checks

