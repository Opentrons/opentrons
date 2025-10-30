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
	uv sync

.PHONY: clean
clean:
	rm -rf site

.PHONY: serve
serve:
	uv run mkdocs serve -f ./mkdocs.yml

.PHONY: pdf-flex
pdf-flex:
	uv run mkdocs build -f ./flex/mkdocs.yml && \
	python flex/export_to_pdf.py flex/site/print_page/index.html site/Opentrons-Flex-Instruction-Manual.pdf 'Opentrons Flex Instruction Manual'