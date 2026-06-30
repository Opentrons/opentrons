.PHONY: help setup configure_robot check-robot \
	test test-nav test-nav-headed \
	test-device-cards test-device-cards-headed \
	_report-banner

# Load persisted robot settings when present (from `make configure_robot`).
ifneq (,$(wildcard .env))
include .env
export
endif

HEADED ?=
PYTEST_HEADED := $(if $(HEADED),HEADED=1,)
PYTEST := uv run pytest

help:
	@echo "Electron regression tests"
	@echo ""
	@echo "Setup:"
	@echo "  make setup                  Install Python deps and Playwright Chromium"
	@echo "  make configure_robot        Prompt for robot name, IP, and protocol"
	@echo "  make check-robot            Verify USB or Wi-Fi robot connectivity"
	@echo ""
	@echo "Tests (uses .env when present):"
	@echo "  make test                   Run all tests"
	@echo "  make test HEADED=1          Run all tests with Electron window visible"
	@echo "  make test-nav               Run navigation smoke tests"
	@echo "  make test-nav-headed        Run navigation tests (headed)"
	@echo "  make test-device-cards      Run device card tests"
	@echo "  make test-device-cards-headed  Run device card tests (headed)"
	@echo ""
	@echo "Pass extra pytest args: make test-nav PYTEST_ARGS=\"-k protocols\""

setup:
	uv sync --frozen
	uv run playwright install chromium

configure_robot:
	uv run python configure_robot.py

check-robot:
	uv run python setup_usb_or_wifi.py

test:
	@status=0; \
	$(PYTEST_HEADED) $(PYTEST) tests/ $(PYTEST_ARGS) || status=$$?; \
	$(MAKE) --no-print-directory _report-banner; \
	exit $$status

test-nav:
	@status=0; \
	$(PYTEST_HEADED) $(PYTEST) tests/nav/ $(PYTEST_ARGS) || status=$$?; \
	$(MAKE) --no-print-directory _report-banner; \
	exit $$status

test-nav-headed:
	@status=0; \
	HEADED=1 $(PYTEST) tests/nav/ $(PYTEST_ARGS) || status=$$?; \
	$(MAKE) --no-print-directory _report-banner; \
	exit $$status

test-device-cards:
	@status=0; \
	$(PYTEST_HEADED) $(PYTEST) tests/device_cards/ $(PYTEST_ARGS) || status=$$?; \
	$(MAKE) --no-print-directory _report-banner; \
	exit $$status

test-device-cards-headed:
	@status=0; \
	HEADED=1 $(PYTEST) tests/device_cards/ $(PYTEST_ARGS) || status=$$?; \
	$(MAKE) --no-print-directory _report-banner; \
	exit $$status

_report-banner:
	@echo ""
	@echo "---------------------------------------------------------"
	@echo "Tests finished."
	@echo "Open test-results/report.html for the HTML report."
	@echo "Videos: test-results/videos/ (headed runs)"
	@echo "Traces: test-results/traces/"
	@echo "---------------------------------------------------------"
