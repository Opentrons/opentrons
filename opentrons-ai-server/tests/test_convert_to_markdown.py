from unittest.mock import MagicMock, mock_open, patch

import pytest
from api.utils.convert_to_markdown import (
    clean_html,
    convert_html_to_markdown,
    extract_and_remove_api_reference,
    extract_tab_content,
    get_latest_version,
    get_markdown_format,
    remove_all_images,
    remove_footer_content,
    remove_list_items_containing_ot1,
    remove_pilcrow_symbols,
    remove_specific_logos,
    remove_top_section,
    run_sphinx_build,
)
from bs4 import BeautifulSoup

# Sample HTML content for testing
sample_html = """
<html>
<head></head>
<body>
<div class="document"></div>
<footer></footer>
<img src="opentrons-images/website/logo.png">
<a>¶</a>
<li>OT-1</li>
<span id="document-new_protocol_api"></span>
<section id="api-version-2-reference"></section>
<div class="sphinx-tabs docutils container">
    <div class="sphinx-tabs-tab">Tab 1</div>
    <div class="sphinx-tabs-panel">Content 1</div>
    <div class="sphinx-tabs-tab">Tab 2</div>
    <div class="sphinx-tabs-panel">Content 2</div>
</div>
</body>
</html>
"""


@pytest.fixture
def soup() -> BeautifulSoup:
    return BeautifulSoup(sample_html, "html.parser")


@pytest.mark.unit
def test_run_sphinx_build() -> None:
    with patch("subprocess.run") as mock_run:
        run_sphinx_build("echo test")
        mock_run.assert_called_once_with("echo test", check=True, shell=True)


@pytest.mark.unit
def test_remove_specific_logos(soup: BeautifulSoup) -> None:
    soup = remove_specific_logos(soup)
    assert not soup.find_all("img", src="opentrons-images/website/logo.png")


@pytest.mark.unit
def test_remove_all_images(soup: BeautifulSoup) -> None:
    soup = remove_all_images(soup)
    assert not soup.find_all("img")


@pytest.mark.unit
def test_remove_pilcrow_symbols(soup: BeautifulSoup) -> None:
    soup = remove_pilcrow_symbols(soup)
    assert not soup.find_all("a", string="¶")


@pytest.mark.unit
def test_remove_list_items_containing_ot1(soup: BeautifulSoup) -> None:
    soup = remove_list_items_containing_ot1(soup)
    assert not soup.find_all("li", string="OT-1")


@pytest.mark.unit
def test_remove_top_section(soup: BeautifulSoup) -> None:
    soup = remove_top_section(soup)
    assert not soup.find("head")


@pytest.mark.unit
def test_remove_footer_content(soup: BeautifulSoup) -> None:
    soup = remove_footer_content(soup)
    assert not soup.find("footer")


@pytest.mark.unit
def test_clean_html(soup: BeautifulSoup) -> None:
    soup = clean_html(soup)
    assert not soup.find_all("img", src="opentrons-images/website/logo.png")
    assert not soup.find_all("img")
    assert not soup.find_all("a", string="¶")
    assert not soup.find_all("li", string="OT-1")
    assert not soup.find("head")
    assert not soup.find("footer")


@pytest.mark.unit
@patch("builtins.open", new_callable=mock_open, read_data=sample_html)
def test_extract_and_remove_api_reference(mock_file: MagicMock, soup: BeautifulSoup) -> None:
    output_file_path = "output.md"
    html_file_path = "index.html"
    soup = extract_and_remove_api_reference(html_file_path, output_file_path)
    assert not soup.find("span", id="document-new_protocol_api")
    assert not soup.find("section", id="api-version-2-reference")


@pytest.mark.unit
def test_extract_tab_content(soup: BeautifulSoup) -> None:
    soup, tab_markdown = extract_tab_content(soup)
    assert len(tab_markdown) == 1


@pytest.mark.unit
@patch("builtins.open", new_callable=mock_open)
def test_convert_html_to_markdown(mock_file: MagicMock, soup: BeautifulSoup) -> None:
    html_file_path = "index.html"
    markdown_file_path = "output.md"
    reference_file_path = "reference.md"
    convert_html_to_markdown(html_file_path, markdown_file_path, reference_file_path)
    mock_file.assert_called()


@pytest.mark.unit
@patch("subprocess.run")
def test_get_latest_version(mock_run: MagicMock) -> None:
    mock_run.return_value.stdout = "docs@2.19_2\n"
    version = get_latest_version()
    assert version == "219"


@pytest.mark.unit
@patch("api.utils.convert_to_markdown.get_latest_version")
@patch("api.utils.convert_to_markdown.run_sphinx_build")
@patch("api.utils.convert_to_markdown.convert_html_to_markdown")
def test_get_markdown_format(mock_convert: MagicMock, mock_build: MagicMock, mock_version: MagicMock) -> None:
    mock_version.return_value = "200"
    get_markdown_format()
    mock_build.assert_called()
    mock_convert.assert_called()
