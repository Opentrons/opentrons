.PHONY: setup teardown format lint test publish-ci publish-local build-packages build-packages-manifests-only

setup:
	uv sync --frozen

teardown:
	rm -rf .venv

format:
	uv run ruff format
	uv run ruff check --fix

lint:
	uv run ruff check
	uv run ruff format --check

test:
	uv run python -m pytest tests/ -v

publish-ci:
	@if [ -z "$(VERSION)" ]; then echo "Set VERSION= to semver or js-packages-release tag ref"; exit 1; fi
	uv run python publish.py --version "$(VERSION)" --non-interactive

publish-local:
	uv run python publish.py --interactive

# With VERSION: build then rewrite package.json. Without VERSION: build only (verify release pipeline).
build-packages:
	@if [ -n "$(VERSION)" ]; then \
		uv run python build_packages.py --version "$(VERSION)"; \
	else \
		uv run python build_packages.py; \
	fi

build-packages-manifests-only:
	@if [ -z "$(VERSION)" ]; then echo "Set VERSION= to semver or js-packages-release tag ref"; exit 1; fi
	uv run python build_packages.py --version "$(VERSION)" --skip-build
