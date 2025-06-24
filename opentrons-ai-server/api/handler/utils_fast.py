import re
from typing import Optional, Tuple


def parse_tagged_content(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    def extract_tag_content(tag_name: str, text: str) -> Optional[str]:
        """Extract content between opening and closing tags."""
        pattern = f"<{tag_name}>(.*?)</{tag_name}>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            content = match.group(1).strip()
            return content if content else None
        return None

    # Extract content from each tag
    thinking_content = extract_tag_content("THINKING", text)
    pd_json_content = extract_tag_content("PD_JSON", text)
    comments_content = extract_tag_content("COMMENTS", text)

    return thinking_content, pd_json_content, comments_content
