# js-package-testing Makefile
# Tests built packages @opentrons/components, @opentrons/shared-data,
# @opentrons/step-generation, and @opentrons/protocol-visualization by
# packing them into .tgz files, extracting to pack/, and linking via pnpm.
# The link: protocol adds entries to package.json and pnpm-lock.yaml but does NOT lock versions,
# so the lockfile won't change when linked package contents change.

# Directory for packed .tgz files and extracted packages
PACK_DIR := pack
SHARED_DATA_PACK := $(PACK_DIR)/opentrons-shared-data-0.0.0-dev.tgz
STEP_GENERATION_PACK := $(PACK_DIR)/opentrons-step-generation-0.0.0-dev.tgz
COMPONENTS_PACK := $(PACK_DIR)/opentrons-components-0.0.0-dev.tgz
PROTOCOL_VISUALIZATION_PACK := $(PACK_DIR)/opentrons-protocol-visualization-0.0.0-dev.tgz
SHARED_DATA_DIR := $(PACK_DIR)/opentrons-shared-data
STEP_GENERATION_DIR := $(PACK_DIR)/opentrons-step-generation
COMPONENTS_DIR := $(PACK_DIR)/opentrons-components
PROTOCOL_VISUALIZATION_DIR := $(PACK_DIR)/opentrons-protocol-visualization

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
	$(MAKE) -C ../shared-data pack
	@echo "Moving shared-data package to pack directory..."
	@mv ../shared-data/opentrons-shared-data-0.0.0-dev.tgz $(SHARED_DATA_PACK)
	@echo "Building step-generation package..."
	$(MAKE) -C ../step-generation pack
	@echo "Moving step-generation package to pack directory..."
	@mv ../step-generation/opentrons-step-generation-0.0.0-dev.tgz $(STEP_GENERATION_PACK)
	@echo "Building components package..."
	$(MAKE) -C ../components pack
	@echo "Moving components package to pack directory..."
	@mv ../components/opentrons-components-0.0.0-dev.tgz $(COMPONENTS_PACK)
	@echo "Building protocol-visualization package..."
	$(MAKE) -C ../protocol-visualization pack
	@echo "Moving protocol-visualization package to pack directory..."
	@mv ../protocol-visualization/opentrons-protocol-visualization-0.0.0-dev.tgz $(PROTOCOL_VISUALIZATION_PACK)
	@echo "Extracting packages..."
	@rm -rf $(SHARED_DATA_DIR) $(STEP_GENERATION_DIR) $(COMPONENTS_DIR) $(PROTOCOL_VISUALIZATION_DIR)
	@mkdir -p $(SHARED_DATA_DIR) $(STEP_GENERATION_DIR) $(COMPONENTS_DIR) $(PROTOCOL_VISUALIZATION_DIR)
	@tar -xzf $(SHARED_DATA_PACK) --strip-components=1 -C $(SHARED_DATA_DIR)
	@tar -xzf $(STEP_GENERATION_PACK) --strip-components=1 -C $(STEP_GENERATION_DIR)
	@tar -xzf $(COMPONENTS_PACK) --strip-components=1 -C $(COMPONENTS_DIR)
	@tar -xzf $(PROTOCOL_VISUALIZATION_PACK) --strip-components=1 -C $(PROTOCOL_VISUALIZATION_DIR)
	@echo "Patching extracted package.json files for external-consumer resolution..."
	node --experimental-strip-types ../scripts/patch-packed-packages.mts
	@echo "Local packages built and extracted successfully!"

# Unlink local packages and clean up pack directory
.PHONY: clean-local-packages
clean-local-packages:
	@echo "Cleaning up pack directory..."
	@rm -rf $(PACK_DIR)
	@echo "Local packages cleaned!"

# Run Playwright tests (visual checkpoints go to Applitools Eyes; set APPLITOOLS_API_KEY)
.PHONY: test
test:
	pnpm playwright test --config=playwright.config.ts

# Same as test, but do not fail Playwright on Eyes DiffsFoundError.
# Use after intentional visual fixture changes: review/accept in Eyes UI, then re-run make test.
.PHONY: test-ignore-diffs
test-ignore-diffs:
	APPLITOOLS_FAIL_ON_DIFF=false pnpm playwright test --config=playwright.config.ts

# Install Playwright browser dependencies (run 'make setup' first)
.PHONY: test-setup
test-setup: setup
	pnpm exec playwright install --with-deps chromium

.PHONY: build
build: setup
	pnpm run build

.PHONY: preview
preview:
	pnpm run preview
