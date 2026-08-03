"""
QA Epic Risk Analyzer — library pieces for GitHub PR/file churn, fan-in/out, and heuristic scoring.

Run the Streamlit app from the `e2e-testing/` directory::

    streamlit run scrape_repo.py

Or ``make -C epic_risk run`` from ``e2e-testing/``.

Import submodules (e.g. ``epic_risk.github``) directly; ``epic_risk.cached`` pulls in Streamlit.
"""

from epic_risk.risk import calculate_risk, generate_reasoning

__all__ = [
    "calculate_risk",
    "generate_reasoning",
]
