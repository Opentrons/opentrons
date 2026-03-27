.PHONY: setup
setup:
	uv sync --frozen

.PHONY: teardown
teardown:
	rm -rf .venv

.PHONY: format
format:
	uv run ruff format
	uv run ruff check --fix

.PHONY: lint
lint:
	uv run ruff check
	uv run ruff format --check

.PHONY: test
test:
	uv run python -m pytest tests/ -v

.PHONY: publish-ci
publish-ci:
	@if [ -z "$(VERSION)" ]; then echo "Set VERSION= to semver or js-packages-release tag ref"; exit 1; fi
	uv run python publish.py --version "$(VERSION)"

.PHONY: publish-current
publish-current:
	uv run python publish.py --current

# With VERSION: build then rewrite package.json. Without VERSION: build only (verify release pipeline).
.PHONY: build-packages
build-packages:
	@if [ -n "$(VERSION)" ]; then \
		uv run python build_packages.py --version "$(VERSION)"; \
	else \
		uv run python build_packages.py; \
	fi

.PHONY: build-packages-manifests-only
build-packages-manifests-only:
	@if [ -z "$(VERSION)" ]; then echo "Set VERSION= to semver or js-packages-release tag ref"; exit 1; fi
	uv run python build_packages.py --version "$(VERSION)" --skip-build
