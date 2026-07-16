import pytest
from api.utils.api_docs_struct_curated import DOCS_V2_DIR
from api.utils.docs_links import (
    audit_synced_doc_links,
    check_production_docs_url,
    doc_href_to_production_url,
    rewrite_markdown_doc_links,
)

from tests.helpers.synced_docs import require_synced_api_docs


@pytest.mark.unit
def test_doc_href_to_production_url_for_relative_markdown_path() -> None:
    assert (
        doc_href_to_production_url("modules/flex-stacker.md", "index.md") == "https://docs.opentrons.com/python-api/modules/flex-stacker/"
    )


@pytest.mark.unit
def test_doc_href_to_production_url_resolves_same_directory_links() -> None:
    assert doc_href_to_production_url("loading.md", "pipettes/index.md") == "https://docs.opentrons.com/python-api/pipettes/loading/"


@pytest.mark.unit
def test_doc_href_to_production_url_resolves_parent_directory_links() -> None:
    assert (
        doc_href_to_production_url("../building-block-commands/liquids.md", "complex-commands/index.md")
        == "https://docs.opentrons.com/python-api/building-block-commands/liquids/"
    )


@pytest.mark.unit
def test_doc_href_to_production_url_maps_flex_docs_outside_python_api() -> None:
    assert doc_href_to_production_url("../flex/installation/index.md", "tutorial.md") == "https://docs.opentrons.com/flex/installation/"


@pytest.mark.unit
def test_doc_href_to_production_url_preserves_fragment() -> None:
    assert (
        doc_href_to_production_url("../labware.md#custom-labware", "modules/setup.md")
        == "https://docs.opentrons.com/python-api/labware/#custom-labware"
    )


@pytest.mark.unit
def test_doc_href_to_production_url_leaves_absolute_links() -> None:
    assert doc_href_to_production_url("https://docs.opentrons.com/python-api/labware") is None
    assert doc_href_to_production_url("https://docs.opentrons.com/v1/index.html") is None


@pytest.mark.unit
def test_rewrite_parent_index_link_to_docs_home() -> None:
    text = "See [other docs](../index.md)."
    assert rewrite_markdown_doc_links(text, "index.md") == "See [other docs](https://docs.opentrons.com/)."


@pytest.mark.unit
def test_rewrite_markdown_doc_links() -> None:
    text = "See [Deck Slots](deck-slots.md)."
    expected = "See [Deck Slots](https://docs.opentrons.com/python-api/deck-slots/)."
    assert rewrite_markdown_doc_links(text, "index.md") == expected


@pytest.mark.unit
def test_synced_api_docs_have_production_doc_links() -> None:
    """Every rewritable markdown doc link in synced docs must be rewritten."""
    require_synced_api_docs()

    audit = audit_synced_doc_links(DOCS_V2_DIR)

    assert not audit.unrewritten_relative_links, audit.unrewritten_relative_links
    assert not audit.invalid_production_doc_links, audit.invalid_production_doc_links
    assert audit.production_doc_urls


@pytest.mark.live
def test_synced_api_docs_production_links_are_reachable() -> None:
    """Production docs URLs referenced by synced markdown should resolve."""
    require_synced_api_docs()

    audit = audit_synced_doc_links(DOCS_V2_DIR)
    failures: list[tuple[str, int | None]] = []

    for url in audit.production_doc_urls:
        status = check_production_docs_url(url)
        if status is None or status >= 400:
            failures.append((url, status))

    assert not failures, failures
