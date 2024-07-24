import os.path
import subprocess

from bs4 import BeautifulSoup
from markdownify import markdownify  # type: ignore


def run_sphinx_build(command: str) -> None:
    """Run the sphinx command to convert rst files to a single HTML file."""
    try:
        subprocess.run(command, check=True, shell=True)
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while running Sphinx build: {e}")


def clean_html(soup: BeautifulSoup) -> BeautifulSoup:
    """Clean up the unused features in the markdown file."""
    # Remove specific logos
    logos = soup.find_all("img", src=lambda x: x and ("opentrons-images/website" in x))
    for logo in logos:
        logo.decompose()

    # Remove all images
    all_images = soup.find_all("img")
    for img in all_images:
        img.decompose()

    # Remove pilcrow symbols
    pilcrow_symbols = soup.find_all("a", string="¶")
    for symbol in pilcrow_symbols:
        symbol.decompose()

    return soup


def extract_tab_content(soup: BeautifulSoup) -> tuple[BeautifulSoup, dict[str, str]]:
    """Find all tabbed content sections and convert each tabbed section to markdown format."""
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
        # Replace the original tab section with a placeholder in the soup
        placeholder = f"tabSection{idx}"
        tab_markdown[placeholder] = combined_section_markdown
        placeholder_tag = soup.new_tag("div")
        placeholder_tag.string = placeholder
        tab_section.replace_with(placeholder_tag)

    return soup, tab_markdown


def convert_html_to_markdown(html_file_path: str, markdown_file_path: str) -> None:
    """Converts an HTML file to a Markdown file with specific modifications."""
    with open(html_file_path, "r", encoding="utf-8") as file:
        html_content = file.read()

    soup = BeautifulSoup(html_content, "html.parser")
    soup = clean_html(soup)
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
        # tag = tag.split('_')[0]

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

    run_sphinx_build(command)
    convert_html_to_markdown(html_file_path, markdown_file_path)


if __name__ == "__main__":
    get_markdown_format()
