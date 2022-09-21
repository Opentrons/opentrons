include ../../../scripts/python.mk

.PHONY: setup, teardown
.DEFAULT_TARGET: setup

setup: teardown
	$(call pipenv,ot-3/update-server) sync --dev

teardown:
	-$(call pipenv,ot-3/update-server) --rm || true

update: teardown
	$(call pipenv,ot-3/update-server) update --dev
