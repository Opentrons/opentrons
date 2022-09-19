include ../../../scripts/python.mk

.PHONY: setup, teardown
.DEFAULT_TARGET: setup

setup:
	$(call pipenv,ot-3/robot-server) sync --dev --verbose

teardown:
	-$(call pipenv,ot-3/robot-server) --rm

update:
	$(call pipenv,ot-3/robot-server) update --dev
