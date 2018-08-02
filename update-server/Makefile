SHELL := /bin/bash

# add yarn CLI dev deps to PATH (for cross platform POSIX commands via shx)
PATH := $(shell cd .. && yarn bin):$(PATH)

python := pipenv run python
pipenv_opts := --dev
pipenv_opts += $(and $(CI),--ignore-pipfile)
port ?= 34000

# make bootstrap wheel file (= rather than := to expand at every use)
wheel = $(wildcard dist/*.whl)

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

.PHONY: bootstrap
bootstrap: wheel
	curl -X POST \
		-H "Content-Type: multipart/form-data" \
		-F "whl=@$(wheel)" \
		http://$(host):31950/server/update/bootstrap

.PHONY: restart
restart:
	curl -X POST http://$(host):31950/server/restart
