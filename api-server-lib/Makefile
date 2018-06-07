SHELL := /bin/bash

# add yarn CLI dev deps to PATH (for cross platform POSIX commands via shx)
PATH := $(shell cd .. && yarn bin):$(PATH)

# make push host
host ?= \[fd00:0:cafe:fefe::1\]
# make push wheel file (= rather than := to expand at every use)
wheel = $(wildcard dist/*.whl)
firmware = $(wildcard smoothie/*.hex)

# python and pipenv config
python := pipenv run python
pipenv_opts := --dev
pipenv_opts += $(and $(CI),--ignore-pipfile)

.PHONY: install
install:
	pipenv install $(pipenv_opts)

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
		--cov=opentrons \
		--cov-report term-missing:skip-covered \
		--cov-report xml:coverage.xml \
		tests

.PHONY: lint
lint:
	$(python) -m pylama ot2serverlib tests

.PHONY: wheel
wheel: clean
	$(python) setup.py bdist_wheel
	shx rm -rf build
	shx ls dist

.PHONY: push
push: wheel
	curl -X POST \
		-H "Content-Type: multipart/form-data" \
		-F "whl=@$(wheel)" \
		http://$(host):31950/server/update

.PHONY: restart
restart:
	curl -X POST http://$(host):31950/server/restart
