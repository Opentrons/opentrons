include ../../scripts/python.mk

.PHONY: setup, teardown
.DEFAULT_TARGET: setup

setup:
	$(call pipenv,dev) sync --dev

teardown:
	-$(call pipenv,dev) --rm || true

update: teardown
	$(call pipenv,dev) update --dev
