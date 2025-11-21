from __future__ import annotations

import re
from typing import List


_LINK_PATTERN = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
_REFERENCE_LINK_PATTERN = re.compile(r"\[([^\]]+)\]\[([^\]]+)\]")
_INLINE_CODE_PATTERN = re.compile(r"(?<!`)`([^`\n]+)`(?!`)")
_ADMONITION_TYPES = {
    "note": "note",
    "warning": "warning",
    "tip": "tip",
    "caution": "warning",
    "important": "important",
}


def _convert_docstring_lines(lines: List[str]) -> List[str]:
    converted = _convert_admonitions(lines)
    converted = _convert_code_fences(converted)
    converted = _convert_html_tables(converted)
    converted = _ensure_blank_line_after_lists(converted)
    converted = [_convert_inline_markup(line) for line in converted]
    return converted


def _strip_literal_markup(text: str) -> str:
    text = re.sub(r"``([^`]*)``", r"\1", text)
    return _INLINE_CODE_PATTERN.sub(r"\1", text)


def _convert_inline_markup(line: str) -> str:
    line = _INLINE_CODE_PATTERN.sub(r"``\1``", line)
    line = _LINK_PATTERN.sub(
        lambda match: f"`{_strip_literal_markup(match.group(1))} <{match.group(2)}>`__",
        line,
    )
    line = _REFERENCE_LINK_PATTERN.sub(
        lambda match: _strip_literal_markup(match.group(1)),
        line,
    )
    return line


def _convert_admonitions(lines: List[str]) -> List[str]:
    result: List[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.lstrip()
        indent = line[: len(line) - len(stripped)]
        if stripped.startswith("!!!"):
            parts = stripped[3:].strip().split(None, 1)
            if not parts:
                result.append(line)
                i += 1
                continue
            admon_type = _ADMONITION_TYPES.get(parts[0].lower(), parts[0].lower())
            title = ""
            if len(parts) > 1:
                title = parts[1].strip().strip('"')
            if result and result[-1].strip():
                result.append("")
            directive = f"{indent}.. {admon_type}::"
            if title:
                directive += f" {title}"
            result.append(directive)
            result.append("")
            i += 1
            content_lines: List[str] = []
            base_indent = indent + "    "
            while i < len(lines):
                next_line = lines[i]
                if not next_line.strip():
                    content_lines.append("")
                    i += 1
                    continue
                if next_line.startswith(base_indent):
                    content_lines.append(next_line[len(base_indent) :])
                    i += 1
                    continue
                break
            if not content_lines:
                content_lines.append("")
            for content in content_lines:
                if content:
                    result.append(f"{indent}   {content}")
                else:
                    result.append(f"{indent}   ")
            result.append("")
            continue
        result.append(line)
        i += 1
    return result


def _convert_code_fences(lines: List[str]) -> List[str]:
    result: List[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.lstrip()
        indent = line[: len(line) - len(stripped)]
        if stripped.startswith("```"):
            language = stripped[3:].strip() or "text"
            i += 1
            code_lines: List[str] = []
            while i < len(lines):
                current = lines[i]
                current_stripped = current.lstrip()
                if current_stripped.startswith("```"):
                    i += 1
                    break
                if current.startswith(indent):
                    code_lines.append(current[len(indent) :])
                else:
                    code_lines.append(current)
                i += 1
            else:
                result.append(line)
                break
            result.append(f"{indent}.. code-block:: {language}")
            result.append("")
            for code_line in code_lines:
                result.append(f"{indent}   {code_line}")
            result.append("")
            continue
        result.append(line)
        i += 1
    return result


def _convert_html_tables(lines: List[str]) -> List[str]:
    result: List[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.lstrip()
        indent = line[: len(line) - len(stripped)]
        if stripped.startswith("<table"):
            html_lines = [line.strip()]
            i += 1
            while i < len(lines):
                html_line = lines[i]
                html_lines.append(html_line.strip())
                if "</table>" in html_line:
                    i += 1
                    break
                i += 1
            result.append(f"{indent}.. raw:: html")
            result.append("")
            for html_line in html_lines:
                if html_line:
                    result.append(f"{indent}   {html_line}")
                else:
                    result.append(f"{indent}   ")
            result.append("")
            continue
        result.append(line)
        i += 1
    return result


def _ensure_blank_line_after_lists(lines: List[str]) -> List[str]:
    result: List[str] = []
    current_list_indent: int | None = None
    for line in lines:
        stripped = line.lstrip()
        indent_len = len(line) - len(stripped)
        is_bullet = stripped.startswith(("- ", "* "))
        if is_bullet:
            current_list_indent = indent_len
        else:
            if current_list_indent is not None:
                if stripped and indent_len <= current_list_indent:
                    if result and result[-1].strip():
                        result.append("")
                    current_list_indent = None
            if not stripped:
                current_list_indent = None
        result.append(line)
    return result


def _process_docstring(app, what, name, obj, options, lines):
    converted = _convert_docstring_lines(list(lines))
    lines[:] = converted


def setup(app):
    app.connect("autodoc-process-docstring", _process_docstring, priority=0)
    return {"parallel_read_safe": True}
