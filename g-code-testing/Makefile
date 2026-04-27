# opentrons g-code-testing makefile

include ../scripts/python-uv.mk

SHX := npx shx

# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/opentrons/tools/test_pipette_memory.py would run only the
# specified test
tests ?= tests
test_opts ?=  --cov=g_code_parsing --cov-report term-missing:skip-covered --cov-report xml:coverage.xml

# test modules to typecheck
tests_to_typecheck := \
	tests/g_code_parsing

files_to_check := g_code_parsing tests cli.py

# Defined separately than the clean target so the wheel file doesn’t have to
# depend on a PHONY target
clean_cmd = $(SHX) rm -rf build dist .coverage coverage.xml '*.egg-info' '**/__pycache__' '**/*.pyc' '**/.mypy_cache'



.PHONY: setup
setup:
	@$(uv_sync_dev)
	@$(UV) pip list

.PHONY: setup-py
setup-py: setup

.PHONY: lock
lock:
	$(UV) lock

.PHONY: clean
clean:
	$(clean_cmd)

.PHONY: teardown
teardown:
	$(SHX) rm -rf .venv

.PHONY: test
test:
	$(pytest) -m 'not slow and not g_code_confirm' $(tests) $(test_opts)

.PHONY: test-g-code-fast
test-g-code-fast:
	$(pytest) -m 'g_code_confirm and not slow' $(tests) $(test_opts)

.PHONY: test-g-code-2-modules
test-g-code-2-modules:
	$(pytest) -m 'slow' -k 'test_2_modules' $(tests) $(test_opts)

.PHONY: test-g-code-swift-smoke
test-g-code-swift-smoke:
	$(pytest) -m 'slow' -k 'test_swift_smoke' $(tests) $(test_opts)

.PHONY: test-g-code-swift-turbo
test-g-code-swift-turbo:
	$(pytest) -m 'slow' -k 'test_swift_turbo' $(tests) $(test_opts)

.PHONY: test-g-code-omega
test-g-code-omega:
	$(pytest) -m 'slow' -k 'test_omega_biotek_magbind_totalpure_ngs' $(tests) $(test_opts)

.PHONY: lint
lint: lint-other
	$(python) -m mypy g_code_parsing $(tests_to_typecheck)
	$(ruff) check $(files_to_check)
	$(ruff) format --check $(files_to_check)

.PHONY: format
format: format-other
	$(ruff) format $(files_to_check)
	$(ruff) check --select I --fix $(files_to_check)

.PHONY: get-g-code-configurations
get-g-code-configurations:
	$(python) cli.py configurations

.PHONY: run-g-code-configuration
run-g-code-configuration:
	$(if $(name),,$(error name variable required))
	$(python) cli.py run ${name}

.PHONY: load-g-code-configuration-comparison
load-g-code-configuration-comparison:
	$(if $(name),,$(error name variable required))
	$(python) cli.py load-comparison ${name}

.PHONY: diff-g-code-configuration-comparison
diff-g-code-configuration-comparison:
	$(if $(name),,$(error name variable required))
	$(python) cli.py diff ${name}

.PHONY: update-g-code-configuration-comparison
update-g-code-configuration-comparison:
	$(if $(name),,$(error name variable required))
	$(python) cli.py update-comparison ${name}

.PHONY: check-for-missing-comparison-files
check-for-missing-comparison-files:
	$(python) cli.py check-for-missing-comparison-files --error_on_missing_configuration_files

FORMAT_FILE_GLOB = "g-code-testing/**/*.{json,md,yml,yaml}"

.PHONY: format-other
format-other:
	cd .. && pnpm exec prettier --ignore-path .eslintignore --write g-code-testing

.PHONY: lint-other
lint-other:
	cd .. && pnpm exec prettier --check --ignore-path .eslintignore g-code-testing
