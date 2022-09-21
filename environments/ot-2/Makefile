include ../../scripts/python.mk

.PHONY: setup, teardown
.DEFAULT_TARGET: setup

setup: teardown
	$(call pipenv,ot-2) sync --dev

teardown:
	-$(call pipenv,ot-2) --rm || true

update: teardown
	$(call pipenv,ot-2) update --dev
