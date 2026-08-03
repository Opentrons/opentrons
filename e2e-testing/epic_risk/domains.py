"""File path → stack domain labels and small display helpers."""

from epic_risk.constants import DOMAIN_KIND_ICON


def categorize_domain(file_path: str) -> str:
    ext = file_path.split(".")[-1].lower() if "." in file_path else ""
    if ext in ["ts", "tsx", "js", "jsx"]:
        return "🖥️ UI / React"
    if ext in ["py"]:
        return "⚙️ API / Python"
    if ext in ["c", "cpp", "h", "hpp"]:
        return "🦾 Firmware / C++"
    if ext in ["bb", "bbappend", "conf"]:
        return "🐧 OS / Bitbake"
    if ext in ["css", "scss", "svg", "png"]:
        return "🎨 Styling/Assets"
    if ext in ["json", "yml", "yaml", "md"]:
        return "📝 Config/Docs"
    return "📁 Other"


def domain_kind_icon(domain: str) -> str:
    return DOMAIN_KIND_ICON.get(domain, "📁")
