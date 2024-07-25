import os.path
import subprocess
import uuid

from bs4 import BeautifulSoup
from markdownify import markdownify  # type: ignore


def run_sphinx_build(command: str) -> None:
    """Run the sphinx command to convert rst files to a single HTML file."""
    try:
        subprocess.run(command, check=True, shell=True)
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while running Sphinx build: {e}")


def remove_specific_logos(soup: BeautifulSoup) -> BeautifulSoup:
    """Remove specific logos from the HTML."""
    logos = soup.find_all("img", src=lambda x: x and ("opentrons-images/website" in x))
    for logo in logos:
        logo.decompose()
    return soup


def remove_all_images(soup: BeautifulSoup) -> BeautifulSoup:
    """Remove all images from the HTML."""
    all_images = soup.find_all("img")
    for img in all_images:
        img.decompose()
    return soup


def remove_pilcrow_symbols(soup: BeautifulSoup) -> BeautifulSoup:
    """Remove all pilcrow symbols from the HTML."""
    pilcrow_symbols = soup.find_all("a", string="¶")
    for symbol in pilcrow_symbols:
        symbol.decompose()
    return soup


def remove_list_items_containing_ot1(soup: BeautifulSoup) -> BeautifulSoup:
    """Remove all <li> elements containing 'OT-1'."""
    list_items = soup.find_all("li")
    for li in list_items:
        if "OT-1" in li.get_text():
            li.decompose()
    return soup


def remove_head_tag(soup: BeautifulSoup) -> BeautifulSoup:
    """Remove the <head> tag from the HTML."""
    head_tag = soup.find("head")
    if head_tag:
        head_tag.decompose()
    return soup


def remove_everything_before_section(soup: BeautifulSoup, class_name: str) -> BeautifulSoup:
    """Remove everything before a specified section."""
    start_section = soup.find("div", class_=class_name)
    if not start_section:
        print(f"Start section with class '{class_name}' not found in the HTML content.")
        return soup
    for previous in list(start_section.previous_siblings):
        previous.extract()
    for parent in list(start_section.parents):
        if parent.name == "body":
            break
        if not parent.find_previous_siblings() and not parent.find_next_siblings():
            parent.extract()
    return soup


def remove_footer_content(soup: BeautifulSoup) -> BeautifulSoup:
    """Remove the footer content from the HTML."""
    footer_section = soup.find("footer")
    if footer_section:
        footer_section.decompose()
    return soup


def clean_html(soup: BeautifulSoup) -> BeautifulSoup:
    """Clean up the unused features in the HTML file."""
    soup = remove_specific_logos(soup)
    soup = remove_all_images(soup)
    soup = remove_pilcrow_symbols(soup)
    soup = remove_list_items_containing_ot1(soup)
    soup = remove_head_tag(soup)
    soup = remove_everything_before_section(soup, "document")
    soup = remove_footer_content(soup)
    return soup


def extract_and_remove_api_reference(html_file_path: str, output_file_path: str) -> BeautifulSoup:
    """Extract and remove the API Version 2 Reference section and write it to a Markdown file."""

    with open(html_file_path, "r", encoding="utf-8") as file:
        html_content = file.read()

    soup = BeautifulSoup(html_content, "html.parser")
    soup = clean_html(soup)

    # Find the start and end points
    start_span = soup.find("span", id="document-new_protocol_api")

    # Get the section to keep
    api_section = start_span.find_next_sibling("section", id="api-version-2-reference")

    # Create a BeautifulSoup object for the extracted section
    extracted_html = str(start_span) + str(api_section)
    reference_markdown = markdownify(extracted_html)

    # Write the extracted content to a Markdown file
    with open(output_file_path, "w", encoding="utf-8") as file:
        file.write(reference_markdown)

    # Remove it from the main markdown file
    start_span.decompose()
    api_section.decompose()

    return soup


def extract_tab_content(soup: BeautifulSoup) -> tuple[BeautifulSoup, dict[str, str]]:
    """Find all tabbed content sections and convert each tabbed section to markdown format."""
    tab_sections = soup.find_all(class_="sphinx-tabs docutils container")
    tab_markdown = {}

    for _idx, tab_section in enumerate(tab_sections):
        tab_buttons = tab_section.find_all(class_="sphinx-tabs-tab")
        tab_panels = tab_section.find_all(class_="sphinx-tabs-panel")

        section_markdown = []
        for button, panel in zip(tab_buttons, tab_panels, strict=False):
            section_markdown.append(f"### {button.text.strip()}\n")
            panel_content = markdownify(str(panel), strip=["div"])
            section_markdown.append(panel_content)
        combined_section_markdown = "\n".join(section_markdown) + "\n\n"
        # Replace the original tab section with an unique placeholder in the soup
        placeholder = f"tabSectionIs{uuid.uuid4().hex}"
        tab_markdown[placeholder] = combined_section_markdown
        placeholder_tag = soup.new_tag("div")
        placeholder_tag.string = placeholder
        tab_section.replace_with(placeholder_tag)

    return soup, tab_markdown


def convert_html_to_markdown(html_file_path: str, markdown_file_path: str, reference_file_path: str) -> None:
    """Converts an HTML file to a Markdown file with specific modifications."""

    soup = extract_and_remove_api_reference(html_file_path, reference_file_path)
    soup, tab_markdown = extract_tab_content(soup)

    modified_html_content = str(soup)
    full_markdown = markdownify(modified_html_content)

    for placeholder, section_md in tab_markdown.items():
        if placeholder in full_markdown:
            full_markdown = full_markdown.replace(placeholder, section_md)

    with open(markdown_file_path, "w", encoding="utf-8") as file:
        file.write(full_markdown)


def get_latest_version() -> str:
    """Get the lastest docs version number."""
    try:
        # Run the git command to get the latest tag
        command = "git tag -l 'docs@2*' --sort=-taggerdate | head -n 1"
        result = subprocess.run(command, capture_output=True, text=True, shell=True)
        # Extract the tag from the output and remove '.'
        tag = "".join(result.stdout.strip().split("."))

        # replace '@' prefix with '_'
        version = tag.replace("@", "_")
        return version
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while getting the version: {e}")
        return ""


def get_markdown_format() -> None:
    """Generates a version-aware Markdown file from HTML documentation."""
    current_version = get_latest_version()
    command = "pipenv run sphinx-build -b singlehtml ../api/docs/v2 api/utils/build/docs/html/v2"
    current_dir = os.path.dirname(__file__)
    html_file_path = os.path.join(current_dir, "build", "docs", "html", "v2", "index.html")
    markdown_file_path = os.path.join(current_dir, "..", "data", f"python_api_{current_version}.md")
    reference_file_path = os.path.join(current_dir, "..", "data", "api_version_reference.md")

    run_sphinx_build(command)

    convert_html_to_markdown(html_file_path, markdown_file_path, reference_file_path)


if __name__ == "__main__":
    get_markdown_format()
