.PHONY: dev build preview setup teardown install-local-packages clean-local-packages test test-setup test-update-snapshots

dev:
	pnpm run dev

build:
	pnpm build

preview:
	pnpm preview

setup: install-local-packages
	pnpm install

teardown: clean-local-packages
	rm -rf node_modules

install-local-packages:
	@echo "Building shared-data package..."
	make -C ../shared-data pack
	@echo "Building components package..."
	cd ../components && make pack
	@echo "Installing local packages..."
	pnpm add ../shared-data/opentrons-shared-data-v0.0.0-dev.tgz
	pnpm add ../components/opentrons-components-v0.0.0-dev.tgz
	@echo "Local packages installed successfully!"

clean-local-packages:
	@echo "Removing local packages..."
	pnpm remove @opentrons/shared-data @opentrons/components
	@echo "Cleaning up package files..."
	rm -f ../shared-data/opentrons-shared-data-v0.0.0-dev.tgz
	rm -f ../components/opentrons-components-v0.0.0-dev.tgz
	@echo "Local packages cleaned!"

test:
	pnpm playwright test --config=playwright.config.ts

test-setup:
	npx playwright install --with-deps chromium

test-update-snapshots:
	pnpm playwright test --config=playwright.config.ts --update-snapshots
