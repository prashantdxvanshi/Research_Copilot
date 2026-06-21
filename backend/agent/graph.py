from langgraph.graph import StateGraph, END
from .state import ResearchState
from .nodes import planner_node, researcher_node, report_generator_node, quality_check_node

def create_workflow():
    """
    Creates and compiles the LangGraph state graph workflow.
    
    Workflow Structure:
    1. entry_point: Start at 'planner' to determine search queries.
    2. 'planner' -> 'researcher': Execute web searches.
    3. 'researcher' -> 'report_generator': Synthesize research results into a report.
    4. 'report_generator' -> 'quality_check': Validate that all report criteria are met.
    5. Conditional Routing ('check_quality'):
       - If quality checks pass OR maximum revisions (2) are reached -> Exit the graph (END).
       - If quality checks fail and revision count is low -> route back to 'researcher' to gather more information.
    """
    # 1. Initialize StateGraph with the ResearchState schema
    workflow = StateGraph(ResearchState)
    
    # 2. Register graph nodes
    workflow.add_node("planner", planner_node)                  # Generates search queries
    workflow.add_node("researcher", researcher_node)            # Performs search queries via DuckDuckGo
    workflow.add_node("report_generator", report_generator_node)# Synthesizes data into a final report
    workflow.add_node("quality_check", quality_check_node)      # Validates generated report quality
    
    # 3. Define Conditional Routing Function
    def check_quality(state: ResearchState):
        """
        Decision node that inspects the current state after the quality check node.
        Determines if the graph should finish or loop back for revision.
        """
        if state.get("quality_passed") or state.get("revision_count", 0) >= 2:
            logger_info_msg = "[graph] Quality check passed or max revisions reached. Exiting."
            return "end"
        return "researcher"

    # 4. Define graph edges (transitions)
    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "researcher")
    workflow.add_edge("researcher", "report_generator")
    workflow.add_edge("report_generator", "quality_check")
    
    # Define conditional routing from quality check
    workflow.add_conditional_edges(
        "quality_check",
        check_quality,
        {
            "researcher": "researcher",
            "end": END
        }
    )
    
    # 5. Compile and return the state graph
    return workflow.compile()

# Compile the workflow graph instance
app_graph = create_workflow()
