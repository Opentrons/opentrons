SHELL := /bin/bash

# add yarn CLI dev deps to PATH (for cross platform POSIX commands via shx)
PATH := $(shell cd .. && yarn bin):$(PATH)

python := pipenv run python
pipenv_opts := --dev
pipenv_opts += $(and $(CI),--ignore-pipfile)
port ?= 34000

.PHONY: install
install:
	pipenv install $(pipenv_opts)

.PHONY: dev
dev:
	ENABLE_VIRTUAL_SMOOTHIE=true $(python) -m otupdate --debug --port $(port)

.PHONY: clean
clean:
	shx rm -rf \
		build \
		dist \
		.coverage \
		coverage.xml \
		'*.egg-info' \
		'**/__pycache__' \
		'**/*.pyc'

.PHONY: test
test:
	$(python) -m pytest \
		--cov=otupdate \
		--cov-report term-missing:skip-covered \
		--cov-report xml:coverage.xml \
		tests -s -vv

.PHONY: lint
lint:
	$(python) -m pylama otupdate tests

.PHONY: wheel
wheel: clean
	$(python) setup.py bdist_wheel
	shx rm -rf build
	shx ls dist
