include ../../scripts/python.mk

.PHONY: setup, teardown
.DEFAULT_TARGET: setup

setup:
	$(pipenv) sync --dev

teardown:
	-$(pipenv) --rm

update:
	$(pipenv) update --dev
