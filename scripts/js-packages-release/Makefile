.PHONY: clean
clean:
	yarn shx rm -rf dist

.PHONY: build
build:
	cd ../.. && yarn tsc -p scripts/js-packages-release/tsconfig.json

.PHONY: format
format:
	cd ../.. && yarn prettier --ignore-path .eslintignore --write "scripts/js-packages-release/**/*.@(ts|mts|md|json)"

.PHONY: lint
lint:
	cd ../.. && yarn eslint --report-unused-disable-directives-severity error --ignore-pattern "node_modules/" "scripts/js-packages-release/**/*.@(ts|mts)"
	cd ../.. && yarn prettier --ignore-path .eslintignore --check "scripts/js-packages-release/**/*.@(ts|mts|md|json)"

.PHONY: test
test:
	cd ../.. && yarn vitest --config scripts/js-packages-release/vitest.config.mts run

.PHONY: publish-ci
publish-ci: build
	@if [ -z "$(VERSION)" ]; then echo "Set VERSION= to semver or js-packages-release tag ref"; exit 1; fi
	node dist/publish.mjs --version "$(VERSION)"

.PHONY: publish-current
publish-current: build
	node dist/publish.mjs --current

# With VERSION: build then rewrite package.json. Without VERSION: build only.
.PHONY: build-packages
build-packages: build
	@if [ -n "$(VERSION)" ]; then \
		node dist/build_packages.mjs --version "$(VERSION)"; \
	else \
		node dist/build_packages.mjs; \
	fi

.PHONY: build-packages-manifests-only
build-packages-manifests-only: build
	@if [ -z "$(VERSION)" ]; then echo "Set VERSION= to semver or js-packages-release tag ref"; exit 1; fi
	node dist/build_packages.mjs --version "$(VERSION)" --skip-build
