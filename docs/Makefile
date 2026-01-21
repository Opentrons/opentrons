FLEX_MANUAL_PREFIX ?= flex

.PHONY: build
build:	
	@if [ -n "$$CI" ]; then \
		uv run mkdocs build -f ./mkdocs.yml --strict; \
	else \
		uv run mkdocs build -f ./mkdocs.yml; \
	fi

.PHONY: setup
setup:
	uv sync --python 3.10 --frozen
	uv run --python 3.10 playwright install --with-deps chromium

.PHONY: teardown
teardown:
	rm -rf .venv

.PHONY: clean
clean:
	rm -rf site

.PHONY: serve
serve:
	uv run --python 3.10 mkdocs serve -f ./mkdocs.yml --livereload

.PHONY: pdf-flex
pdf-flex:
	uv run --python 3.10 mkdocs build -f ./flex/mkdocs.yml && \
	uv run --python 3.10 python flex/export_to_pdf.py flex/site/print_page/index.html site/Opentrons-Flex-Instruction-Manual.pdf 'Opentrons Flex Instruction Manual'