include ../../scripts/python.mk

.PHONY: setup, teardown
.DEFAULT_TARGET: setup

setup:
	$(call pipenv,app) sync --dev

teardown:
	-$(call pipenv,app) --rm || true

update:
	$(call pipenv,app) update --dev
