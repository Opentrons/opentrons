include ../../scripts/python.mk

.PHONY: setup, teardown
.DEFAULT_TARGET: setup

setup: teardown
	$(call pipenv,ot-2) sync --dev --verbose

teardown:
	-$(call pipenv,ot-2) --rm

update: teardown
	$(call pipenv,ot-2) update --dev
