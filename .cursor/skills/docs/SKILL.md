---
name: docs
description: Authoring and styling guidelines for the Opentrons /docs MkDocs project. Covers file conventions, frontmatter, page titles, header IDs, image formats, tables, code blocks, Python API reference (mkdocstrings, autorefs, macros), and CSS patterns (parts lists, screenshots, icons, instruction lists, side-by-side figures, fonts, colors). Use when writing, editing, or reviewing any file in the docs/ directory, or when the user asks about MkDocs conventions, docstrings, CSS classes, or the Python API reference.
---

# Opentrons Docs: MkDocs Authoring Guide

The `/docs` project uses MkDocs with the Material theme, the monorepo plugin, mkdocstrings (Python), autorefs, and macros. Config lives in `docs/mkdocs.yml`. Extra CSS: `opentrons-theme.css`, `instruction-manuals.css`, `python-api.css`.

## Directory Structure of `/docs`

The `/docs` directory is organized to support multiple documentation publications, site-global shared resources, and project build scripts.

### Publication Directories (Multiple MkDocs Projects)

- Each major documentation set ("publication") exists in its own subdirectory, with its own `mkdocs.yml` and content:
    | Publication Directory             | Description                              |
    |-----------------------------------|------------------------------------------|
    | `docs/absorbance-plate-reader/`   | Absorbance Plate Reader Module manual    |
    | `docs/flex/`                      | Opentrons Flex robot manual              |
    | `docs/heater-shaker/`             | Heater-Shaker Module manual              |
    | `docs/hepa-uv/`                   | HEPA/UV Module manual                    |
    | `docs/protocol-designer/`         | Protocol Designer application manual     |
    | `docs/python-api/`                | Python API reference and guides          |
    | `docs/stacker/`                   | Flex Stacker Module manual               |
    | `docs/temperature-module/`        | Temperature Module manual                |
    | `docs/thermocycler/`              | Thermocycler Module manual               |
- **Each publication** is a self-contained MkDocs project, but shares a unified build/serve flow via the monorepo and the `mkdocs-monorepo-plugin`.
- New publications may be added for new (or newly documented) software or hardware products.
- Top-level `/docs/mkdocs.yml` aggregates all publications for the overall site, referencing their content via the monorepo plugin.

### `docs/shared/`: Shared Content and Resources

- `docs/shared/` holds assets, MDX-style includes, and support content used across multiple publications:
    - **Images**: `docs/shared/images/` — interface elements used in multiple publications.
    - **Icons**: `docs/shared/icons/` — custom Opentrons SVG icons.
    - **Theme overrides**: `docs/shared/partials/` — HTML files used to modify the base Material theme.
    - **CSS**: Sitewide overrides in `docs/shared/` (e.g., `opentrons-theme.css`, `instruction-manuals.css`).
- Refer to these resources in any publication via the monorepo plugin's path mapping.
- The only user-facing pages in `shared/` are navigation pages, like `docs/shared/modules/index.md`.

### 3. Scripts and Ancillary Files

- Top-level `/docs/` contains scripts and files for building, developing, and managing the documentation site:
    - **`mkdocs.yml`** — main config aggregating all sub-projects with the monorepo plugin.
    - **Python setup**: `pyproject.toml` specifies the `uv` setup, including the mkdocs package and required plugins.
    - **`Makefile`**: Contains commands for building the docs using the virtual environment.
- These files support the docs build but are not included as user-facing content.

**Recommendation:** Add your new publication as a subdirectory under `/docs/`, and place shared assets only in `shared/`. Scripts and configuration should remain at the top level unless specific to a publication.



## File Conventions

- **Filenames**: Short, lowercase, hyphen-separated. Example: `opentrons-app.md`
- **No H1 in markdown files.** The page title comes from `mkdocs.yml` nav.
- **`title` frontmatter**: Required on every page. Controls the sticky title when scrolling and search results. Format: `"Publication Name: Page Title"`. Omit repeated words.

```yaml
---
title: "Opentrons Flex: Support and Contact Information"
---
```

- **Hide TOC** (cover pages only):

```yaml
---
title: "HEPA/UV Module Instruction Manual"
hide: TOC
---
```

## Header IDs

The `autorefs` plugin warns on duplicate headings across the entire site. Add unique IDs to disambiguate:

```markdown
## Tips and tip racks { #tips-and-tip-racks-ot2 }
## Tips and tip racks { #tips-and-tip-racks-flex }
## Air gap { #air-gap-building-block }
## Air gap { #air-gap-complex }
```

Format: slug of header text + hyphen + short unique suffix. The `#` and spaces inside `{ }` are required.

## Images

- **Vector illustrations**: SVG preferred.
- **Raster (screenshots, renders)**: PNG. High-DPI (2×) for screenshots. Resample large files to ≤1200px wide. Optimize with ImageOptim before committing.

## Tables

Use **Markdown tables** by default:

```markdown
| Specification | Description |
|:--------------|:------------|
| Module weight | 790 g       |
```

Switch to **HTML tables** when you need: `rowspan`/`colspan`, embedded lists, or CSS class attributes (e.g., `.my-dot` status icons).

**Column widths** (use sparingly — only when auto-widths are unusable):

```markdown
| Setting {style="width: 25%;"} | Description |
|------|------|
| Flow rates | Set aspirate/dispense speed. |
```

Requires `attr_list` in `markdown_extensions` (already enabled globally).

## Code Blocks

Always declare the language explicitly for syntax highlighting:

````markdown
```python
foo = "bar"
```
````

## Python API Docs (PAPI)

### Version Notices

No special plugin — use italic text in its own paragraph:

```markdown
*New in version 2.15*

*Changed in version 2.16:* The `mount` parameter is optional.
```

### Linking to the API Reference

Combines mkdocstrings (unique IDs = fully qualified object names) with autorefs (cross-page links):

```markdown
[`InstrumentContext.aspirate()`][opentrons.protocol_api.InstrumentContext.aspirate]
[`aspirate()`][opentrons.protocol_api.InstrumentContext.aspirate]
When [aspirating][opentrons.protocol_api.InstrumentContext.aspirate], you should…

[`well_bottom_clearance`][opentrons.protocol_api.InstrumentContext.well_bottom_clearance]
Adjust the [bottom clearance][opentrons.protocol_api.InstrumentContext.well_bottom_clearance] to…
```

Rules:
- Python object names → monospace (backticks)
- Descriptive link text → regular font
- Methods get trailing `()`, other objects do not

### mkdocstrings Reference Pages

Pull an entire class's public docstrings:

```markdown
::: opentrons.protocol_api.Liquid
```

**Exclude** additional members (must restate global filters):

```markdown
::: opentrons.protocol_api.Well
    options:
      filters:
        - "!^__"
        - "!estimate_liquid_height_after_pipetting"
```

**Include only specific members** (rare):

```markdown
::: opentrons.protocol_api.LiquidClass
    options:
      filters:
        - "get_for"
```

### Docstring Format

Google-style docstrings (configured globally in `mkdocs.yml`):

```python
"""
Blow an extra amount of air through a pipette's tip to clear it.

Args:
    location:
        The blowout location.
        If no location is specified, the pipette will blow out from its current
        position.

        *Changed in version 2.16*: Accepts `TrashBin` and `WasteChute` values.

Raises:
    RuntimeError: If no location is specified and the location cache is `None`.

Returns:
    InstrumentContext: This instance.
"""
```

The `@requires_version` decorator auto-populates the minimum API version in the reference header — no extra markup needed.

### Macros (Text Substitutions)

Two global substitutions defined in `mkdocs.yml` under `extra:`:

```yaml
extra:
  apiLevel: 2.27
  robot_stack_version: 8.8.0
```

Use with double braces and a space inside:

```python
requirements = {"robotType": "Flex", "apiLevel": "{{ apiLevel }}"}
```

Substitutions are active in all content including code blocks. **Update `mkdocs.yml` whenever the API level or robot stack version is bumped.**

## CSS Patterns

All custom CSS lives in the `extra_css` files. The patterns below are already defined in the shared theme; use the class names as shown.

### Parts Lists (Image Grids)

Flex grid: 2–4 figures per row depending on window size. Used in hardware manuals.

```html
<div class="parts-list" markdown>

<figure markdown> ![Opentrons Flex robot](images/parts-list/flex-robot.svg "Opentrons Flex robot") <figcaption>(1) Opentrons Flex robot</figcaption> </figure>

<figure markdown> ![USB cable](images/parts-list/usb-cable.svg "USB cable") <figcaption>(1) USB cable</figcaption> </figure>

</div>
```

### Screenshots with Borders

White-background screenshots need a border to stand out:

```html
<figure class="screenshot" markdown>
![Alt text describing screenshot.](images/my-screen.png "Screen title")
</figure>
```

### Side-by-Side Figures

Exactly two images side by side (compare/contrast):

```html
<figure class="side-by-side" markdown>
![Green run completed screen.](images/run-completed.png "Run completed")
![Red run failed screen.](images/run-failed.png "Run failed")
</figure>
```

For three or more images, use the `parts-list` pattern instead.

### Instruction Lists (Circular Numbered Bullets)

For unboxing/setup steps — numbered items with large blue circular bullets. Close and reopen the `div` when a header interrupts the list (numbering continues with `sane_lists`):

```html
<div class="instruction-list" markdown>

1. Unlock the eight latches holding the top to the sides.

   ![Crate latches.](images/unboxing/1-crate-latches.svg "Unboxing step 1")

2. Remove the top panel.

</div>

### Part 2: Release the Flex

<div class="instruction-list" markdown>

3. Continue with next numbered step…

</div>
```

### Material Icons

Insert icons inline using shortcodes (don't overuse for decoration):

```markdown
Click the :octicons-x-circle-fill-16: on a fixture to remove it.
```

### Custom Opentrons Icons

1. Put in `docs/shared/icons/opentrons/`. Rename with lowercase-hyphens and `.svg` extension (e.g., `protocol-designer.svg`).
2. Use shortcode: `:opentrons-protocol-designer:`
3. Run `mkdocs build` — new icons don't appear under `mkdocs serve` until a full build.

Use only **outline variants** for consistency.

### Round Colored Status Dots

For LED color/pattern tables (modules like Stacker):

```html
<td><span class="my-dot green"></span> Green</td>
<td><span class="my-dot blue"></span> Blue</td>
```

Available colors: `white`, `green`, `blue`, `red`, `yellow`. Other colors can be added in CSS file as needed.

### Table Header Color

Table `<th>` cells are automatically styled blue (`#D0E6FE`) by the theme CSS. To highlight cells outside the first row, use an HTML table with explicit `<th>` placement (e.g., a horizontal header column).

## Fonts & Colors

- **Proportional**: Public Sans
- **Monospace**: Reddit Mono
- **Primary blue**: `#006CFA`
- **Accent orange**: `#F09D20`

These are set globally in `opentrons-theme.css`. Do not override them in page-level CSS.
