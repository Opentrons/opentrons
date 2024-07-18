import os.path

from bs4 import BeautifulSoup 
from markdownify import markdownify 

current_dir = os.path.dirname(__file__)
html_file_path = os.path.join(current_dir, "build", "docs", "html", "v2", "index.html")
markdown_file_path = os.path.join(current_dir, "index.md")

with open(html_file_path, "r", encoding="utf-8") as file:
    html_content = file.read()

soup = BeautifulSoup(html_content, "html.parser")

logos = soup.find_all("img", src=lambda x: x and ("opentrons-images/website" in x))
for logo in logos:
    logo.decompose()

all_images = soup.find_all("img")
for img in all_images:
    img.decompose()

pilcrow_symbols = soup.find_all("a", string="¶")
for symbol in pilcrow_symbols:
    symbol.decompose()

tab_sections = soup.find_all(class_="sphinx-tabs docutils container")

tab_markdown = {}

for idx, tab_section in enumerate(tab_sections):
    tab_buttons = tab_section.find_all(class_="sphinx-tabs-tab")
    tab_panels = tab_section.find_all(class_="sphinx-tabs-panel")

    section_markdown = []
    for button, panel in zip(tab_buttons, tab_panels, strict=False):
        section_markdown.append(f"### {button.text.strip()}\n")
        panel_content = markdownify(str(panel), strip=["div"])
        section_markdown.append(panel_content)
    combined_section_markdown = "\n".join(section_markdown) + "\n\n"
    placeholder = f"tabSection{idx}"
    tab_markdown[placeholder] = combined_section_markdown
    placeholder_tag = soup.new_tag("div")
    placeholder_tag.string = placeholder
    tab_section.replace_with(placeholder_tag)

modified_html_content = str(soup)

full_markdown = markdownify(modified_html_content)

for placeholder, section_md in tab_markdown.items():
    if placeholder in full_markdown:
        full_markdown = full_markdown.replace(placeholder, section_md)

with open(markdown_file_path, "w", encoding="utf-8") as file:
    file.write(full_markdown)
