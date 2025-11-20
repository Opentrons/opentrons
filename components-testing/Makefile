# components-testing Makefile
# This project tests built packages of @opentrons/components and @opentrons/shared-data
# by extracting them to a local pack directory and linking via pnpm link.
# The link: protocol adds entries to package.json and pnpm-lock.yaml but does NOT lock versions,
# so the lockfile won't change when linked package contents change.

# Directory for packed .tgz files and extracted packages
PACK_DIR := pack
SHARED_DATA_PACK := $(PACK_DIR)/opentrons-shared-data-v0.0.0-dev.tgz
COMPONENTS_PACK := $(PACK_DIR)/opentrons-components-v0.0.0-dev.tgz
SHARED_DATA_DIR := $(PACK_DIR)/opentrons-shared-data
COMPONENTS_DIR := $(PACK_DIR)/opentrons-components

# Development server
.PHONY: dev
dev: setup
	pnpm run dev

# Complete setup: build and extract packages first, then install with frozen lockfile
.PHONY: setup
setup:
	$(MAKE) build-local-packages
	pnpm install --frozen-lockfile

# Complete teardown: remove packages and node_modules
.PHONY: teardown
teardown: clean-local-packages
	rm -rf node_modules

# Build and extract local packages (must run before pnpm install due to link: entries in package.json)
.PHONY: build-local-packages
build-local-packages:
	@echo "Creating pack directory..."
	@mkdir -p $(PACK_DIR)
	@echo "Building shared-data package..."
	make -C ../shared-data pack
	@echo "Moving shared-data package to pack directory..."
	@mv ../shared-data/opentrons-shared-data-v0.0.0-dev.tgz $(SHARED_DATA_PACK)
	@echo "Building components package..."
	make -C ../components pack
	@echo "Moving components package to pack directory..."
	@mv ../components/opentrons-components-v0.0.0-dev.tgz $(COMPONENTS_PACK)
	@echo "Extracting packages..."
	@mkdir -p $(SHARED_DATA_DIR) $(COMPONENTS_DIR)
	@tar -xzf $(SHARED_DATA_PACK) --strip-components=1 -C $(SHARED_DATA_DIR)
	@tar -xzf $(COMPONENTS_PACK) --strip-components=1 -C $(COMPONENTS_DIR)
	@echo "Local packages built and extracted successfully!"

# Unlink local packages and clean up pack directory
.PHONY: clean-local-packages
clean-local-packages:
	@echo "Cleaning up pack directory..."
	@rm -rf $(PACK_DIR)
	@echo "Local packages cleaned!"

# Run Playwright tests
.PHONY: test
test:
	pnpm playwright test --config=playwright.config.ts

# Install Playwright browser dependencies (run 'make setup' first)
.PHONY: test-setup
test-setup: setup
	pnpm exec playwright install --with-deps chromium

# Update Playwright snapshots (use after intentional style changes)
.PHONY: test-update-snapshots
test-update-snapshots:
	pnpm playwright test --config=playwright.config.ts --update-snapshots
