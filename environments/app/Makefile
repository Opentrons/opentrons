include ../../scripts/python.mk

.PHONY: setup, teardown
.DEFAULT_TARGET: setup

setup: teardown
	$(call pipenv,app) install --dev --skip-lock --python $(OT_PYTHON)

teardown:
	$(call pipenv,app) --rm || true
