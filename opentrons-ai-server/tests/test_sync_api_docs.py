from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from api.domain.anthropic_predict import AnthropicPredict
from api.utils.api_docs_metadata import get_default_api_level
from api.utils.api_docs_struct_curated import (
    DOCS_V2_DIR,
    LEGACY_RST_TO_MD,
    CurationCoverageError,
    assert_curation_coverage,
    audit_curation_coverage,
)
from api.utils.sync_api_docs import (
    DocSummary,
    generate_api_docs_struct,
    parse_api_level_from_mkdocs_yml,
    summarize_markdown_file,
    sync_api_docs,
)


@pytest.mark.unit
def test_parse_api_level_from_mkdocs_yml() -> None:
    content = """
extra:
  apiLevel: 2.28
  robot_stack_version: 9.0.0
"""
    assert parse_api_level_from_mkdocs_yml(content) == "2.28"


@pytest.mark.unit
def test_get_default_api_level_reads_manifest(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    api_docs_root = tmp_path / "api_docs"
    api_docs_root.mkdir()
    manifest = api_docs_root / ".api-level"
    manifest.write_text("2.28\n", encoding="utf-8")

    monkeypatch.setattr("api.utils.api_docs_metadata.API_DOCS_ROOT", api_docs_root)
    monkeypatch.setattr("api.utils.api_docs_metadata.API_LEVEL_MANIFEST_PATH", manifest)
    monkeypatch.setattr("api.utils.api_docs_metadata.API_DOCS_STRUCT_PATH", api_docs_root / "api_docs_struct.md")

    assert get_default_api_level() == "2.28"


@pytest.mark.unit
def test_summarize_markdown_file_uses_frontmatter(tmp_path: Path) -> None:
    docs_root = tmp_path / "docs"
    docs_root.mkdir()
    doc_path = docs_root / "modules" / "index.md"
    doc_path.parent.mkdir(parents=True)
    doc_path.write_text(
        "---\ntitle: Hardware Modules\ndescription: Overview of powered and unpowered modules.\n---\n\n# Hardware Modules\n",
        encoding="utf-8",
    )

    summary = summarize_markdown_file(doc_path, docs_root)

    assert summary == DocSummary(
        relative_path="modules/index.md",
        title="Hardware Modules",
        about="Overview of powered and unpowered modules.",
    )


@pytest.mark.unit
def test_generate_api_docs_struct_writes_paths(tmp_path: Path) -> None:
    docs_root = tmp_path / "docs"
    docs_root.mkdir()
    (docs_root / "index.md").write_text("# Index\n\nWelcome to the API.\n", encoding="utf-8")
    output_path = tmp_path / "api_docs_struct.md"

    generate_api_docs_struct(docs_root, output_path, "mkdocs-2026-06-02", "2.28")

    content = output_path.read_text(encoding="utf-8")
    assert "Documentation tag: mkdocs-2026-06-02" in content
    assert "Default apiLevel: 2.28" in content
    assert "### 1. index.md" in content
    assert "<about>" in content
    assert "Use these descriptions to match user queries" in content


@pytest.mark.unit
def test_generate_api_docs_struct_prefers_curated_about(tmp_path: Path) -> None:
    docs_root = tmp_path / "docs"
    docs_root.mkdir()
    (docs_root / "modules" / "index.md").parent.mkdir(parents=True)
    (docs_root / "modules" / "index.md").write_text(
        "---\ntitle: Hardware Modules\ndescription: Short frontmatter summary.\n---\n\n# Hardware Modules\n",
        encoding="utf-8",
    )
    output_path = tmp_path / "api_docs_struct.md"
    curated = {"modules/index.md": "Curated LLM description for hardware modules index."}

    generate_api_docs_struct(
        docs_root,
        output_path,
        "mkdocs-2026-06-02",
        "2.28",
        curated_about=curated,
    )

    content = output_path.read_text(encoding="utf-8")
    assert "Curated LLM description for hardware modules index." in content
    assert "Short frontmatter summary." not in content


@pytest.mark.unit
def test_sync_api_docs_copies_docs_and_generates_struct(tmp_path: Path) -> None:
    repo_root = tmp_path / "repo"
    repo_root.mkdir()
    (repo_root / ".git").mkdir()

    source_docs = tmp_path / "source" / "docs" / "python-api" / "docs"
    source_docs.mkdir(parents=True)
    (source_docs / "tutorial.md").write_text("# Tutorial\n\nLearn protocols.\n", encoding="utf-8")

    dest_dir = tmp_path / "dest" / "docs" / "v2"
    struct_path = tmp_path / "dest" / "api_docs_struct.md"
    api_level_manifest = tmp_path / "dest" / ".api-level"

    with (
        patch("api.utils.sync_api_docs.fetch_docs_tree", return_value=(source_docs, None)),
        patch("api.utils.sync_api_docs.fetch_default_api_level", return_value="2.28"),
        patch("api.utils.sync_api_docs.API_LEVEL_MANIFEST_PATH", api_level_manifest),
    ):
        synced_tag = sync_api_docs(
            tag="mkdocs-2026-06-02",
            repo_root=repo_root,
            dest_dir=dest_dir,
            struct_output_path=struct_path,
        )

    assert synced_tag == "mkdocs-2026-06-02"
    assert (dest_dir / "tutorial.md").exists()
    assert struct_path.exists()
    assert api_level_manifest.read_text(encoding="utf-8") == "2.28\n"


@pytest.mark.unit
def test_audit_curation_coverage_reports_missing_and_orphan_paths(tmp_path: Path) -> None:
    docs_root = tmp_path / "docs"
    docs_root.mkdir()
    (docs_root / "index.md").write_text("# Index\n", encoding="utf-8")
    (docs_root / "new-page.md").write_text("# New\n", encoding="utf-8")
    curated = {"index.md": "Curated index.", "stale-page.md": "No longer synced."}

    report = audit_curation_coverage(docs_root, curated)

    assert report.missing_curation == ("new-page.md",)
    assert report.orphan_curation == ("stale-page.md",)


@pytest.mark.unit
def test_assert_curation_coverage_raises_on_gaps(tmp_path: Path) -> None:
    docs_root = tmp_path / "docs"
    docs_root.mkdir()
    (docs_root / "index.md").write_text("# Index\n", encoding="utf-8")

    with pytest.raises(CurationCoverageError, match="Synced docs missing"):
        assert_curation_coverage(docs_root, {})


@pytest.mark.unit
def test_synced_api_docs_have_full_curation_coverage() -> None:
    if not DOCS_V2_DIR.is_dir():
        pytest.skip("Synced API docs not present; run make sync-api-docs first.")

    report = assert_curation_coverage(DOCS_V2_DIR)

    assert report.synced_paths
    assert report.synced_paths == report.curated_paths


@pytest.mark.unit
def test_api_doc_resolve_path_supports_markdown_and_legacy_rst() -> None:
    with patch("api.domain.anthropic_predict.get_default_api_level", return_value="2.28"):
        predict = AnthropicPredict(settings=MagicMock())

    markdown_path = predict._api_doc_resolve_path("modules/index.md")
    legacy_path = predict._api_doc_resolve_path("docs/v2/new_modules.rst")

    assert markdown_path is not None
    assert markdown_path.name == "index.md"
    assert legacy_path == markdown_path
    assert "docs/v2/new_modules.rst" in LEGACY_RST_TO_MD
