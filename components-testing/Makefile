# components-testing Makefile
# This project tests built packages of @opentrons/components and @opentrons/shared-data
# by extracting them to a local pack directory and linking via pnpm link.
# This avoids modifying package.json or pnpm-lock.yaml.

# Directory for packed .tgz files and extracted packages
PACK_DIR := pack
SHARED_DATA_PACK := $(PACK_DIR)/opentrons-shared-data-v0.0.0-dev.tgz
COMPONENTS_PACK := $(PACK_DIR)/opentrons-components-v0.0.0-dev.tgz
SHARED_DATA_DIR := $(PACK_DIR)/opentrons-shared-data
COMPONENTS_DIR := $(PACK_DIR)/opentrons-components

# Development server
.PHONY: dev
dev:
	pnpm run dev

# Build production bundle
.PHONY: build
build:
	pnpm build

# Preview production build
.PHONY: preview
preview:
	pnpm preview

# Complete setup: build packages, install them, and install dependencies
.PHONY: setup
setup: install-local-packages
	pnpm install

# Complete teardown: remove packages and node_modules
.PHONY: teardown
teardown: clean-local-packages
	rm -rf node_modules

# Build and link local packages without modifying package.json
.PHONY: install-local-packages
install-local-packages:
	@echo "Creating pack directory..."
	@mkdir -p $(PACK_DIR)
	@echo "Building shared-data package..."
	make -C ../shared-data pack
	@echo "Building components package..."
	make -C ../components pack
	@echo "Moving components package to pack directory..."
	@mv ../components/opentrons-components-v0.0.0-dev.tgz $(COMPONENTS_PACK)
	@echo "Extracting packages..."
	@mkdir -p $(SHARED_DATA_DIR) $(COMPONENTS_DIR)
	@tar -xzf $(SHARED_DATA_PACK) --strip-components=1 -C $(SHARED_DATA_DIR)
	@tar -xzf $(COMPONENTS_PACK) --strip-components=1 -C $(COMPONENTS_DIR)
	@echo "Linking packages via pnpm link..."
	cd $(SHARED_DATA_DIR) && pnpm link --global
	cd $(COMPONENTS_DIR) && pnpm link --global
	pnpm link --global @opentrons/shared-data @opentrons/components
	@echo "Local packages linked successfully!"

# Unlink local packages and clean up pack directory
.PHONY: clean-local-packages
clean-local-packages:
	@echo "Unlinking local packages..."
	-@pnpm unlink --global @opentrons/shared-data 2>/dev/null || true
	-@pnpm unlink --global @opentrons/components 2>/dev/null || true
	-@cd $(SHARED_DATA_DIR) && pnpm unlink --global 2>/dev/null || true
	-@cd $(COMPONENTS_DIR) && pnpm unlink --global 2>/dev/null || true
	@echo "Cleaning up pack directory..."
	@rm -rf $(PACK_DIR)
	@echo "Local packages cleaned!"

# Run Playwright tests
.PHONY: test
test:
	pnpm playwright test --config=playwright.config.ts

# Install Playwright browser dependencies
.PHONY: test-setup
test-setup:
	npx playwright install --with-deps chromium

# Update Playwright snapshots (use after intentional style changes)
.PHONY: test-update-snapshots
test-update-snapshots:
	pnpm playwright test --config=playwright.config.ts --update-snapshots
