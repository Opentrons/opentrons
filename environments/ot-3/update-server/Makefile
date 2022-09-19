include ../../../scripts/python.mk

.PHONY: setup, teardown
.DEFAULT_TARGET: setup

setup:
	$(call pipenv,ot-3/update-server) sync --dev

teardown:
	-$(call pipenv,ot-3/update-server) --rm

update:
	$(call pipenv,ot-3/update-server) update --dev
