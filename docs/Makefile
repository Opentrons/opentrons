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

# Subprojects with print-site in mkdocs.yml. For each new project, add to PDF_PROJECTS and
# pdf-title-<dir> / pdf-file-<dir>. print_page is always <dir>/site/print_page/index.html
PDF_PROJECTS := \
	absorbance-plate-reader \
	flex \
	heater-shaker \
	hepa-uv \
	ot-2 \
	protocol-designer \
	python-api \
	stacker \
	temperature-module \
	thermocycler

pdf-title-absorbance-plate-reader := Absorbance Plate Reader Instruction Manual
pdf-file-absorbance-plate-reader := Opentrons-Absorbance-Plate-Reader-Instruction-Manual.pdf
pdf-title-flex := Opentrons Flex Instruction Manual
pdf-file-flex := Opentrons-Flex-Instruction-Manual.pdf
pdf-title-heater-shaker := Heater-Shaker Module GEN1 Instruction Manual
pdf-file-heater-shaker := Opentrons-Heater-Shaker-Module-Instruction-Manual.pdf
pdf-title-hepa-uv := HEPA/UV Module Instruction Manual
pdf-file-hepa-uv := Opentrons-HEPA-UV-Module-Instruction-Manual.pdf
pdf-title-ot-2 := Opentrons OT-2 Instruction Manual
pdf-file-ot-2 := Opentrons-OT-2-Instruction-Manual.pdf
pdf-title-protocol-designer := Protocol Designer Instruction Manual
pdf-file-protocol-designer := Opentrons-Protocol-Designer-Instruction-Manual.pdf
pdf-title-python-api := Opentrons Python Protocol API
pdf-file-python-api := Opentrons-Python-Protocol-API.pdf
pdf-title-stacker := Opentrons Flex Stacker Instruction Manual
pdf-file-stacker := Opentrons-Flex-Stacker-Instruction-Manual.pdf
pdf-title-temperature-module := Temperature Module GEN2 Instruction Manual
pdf-file-temperature-module := Opentrons-Temperature-Module-Instruction-Manual.pdf
pdf-title-thermocycler := Thermocycler GEN2 Instruction Manual
pdf-file-thermocycler := Opentrons-Thermocycler-Instruction-Manual.pdf

.PHONY: pdf pdf-all
pdf:
	@if [ -z "$(PROJECT)" ]; then \
		echo 'Usage: make pdf PROJECT=<dir>'; \
		echo 'Projects: $(PDF_PROJECTS)'; \
		exit 1; \
	fi
	@case " $(PDF_PROJECTS) " in *" $(PROJECT) "*) ;; *) \
		echo "Unknown PROJECT '$(PROJECT)'. Valid: $(PDF_PROJECTS)"; exit 1;; \
	esac
	uv run --python 3.10 mkdocs build -f ./$(PROJECT)/mkdocs.yml && \
	uv run --python 3.10 python ./scripts/export_to_pdf.py \
		$(PROJECT)/site/print_page/index.html \
		site/$(pdf-file-$(PROJECT)) \
		'$(pdf-title-$(PROJECT))'

pdf-all:
	@for p in $(PDF_PROJECTS); do $(MAKE) pdf PROJECT=$$p; done

.PHONY: lock
lock:
	uv lock

.PHONY: test
test:
# No tests in this project.
# This target exists to support `make test-py` in the top-level Makefile.

.PHONY: lint
lint:
# No linting to do in this project.
# This target exists to support `make lint-py` in the top-level Makefile.

.PHONY: format
format:
# No formatting to do in this project.
# This target exists to support `make format-py` in the top-level Makefile.
