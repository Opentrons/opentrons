# opentrons api makefile

SHELL := /bin/bash

python := pipenv run python
pipenv_opts := --dev
pipenv_opts += $(and $(CI),--ignore-pipfile)

.PHONY: install
install:
	pipenv install $(pipenv_opts)

.PHONY: test
test:
	$(python) -m pytest \
		--cov=opentrons \
		--cov-report term-missing:skip-covered \
		--cov-report xml:coverage.xml \
		tests

.PHONY: lint
lint:
	$(python) -m pylama opentrons tests

.PHONY: docs
docs:
	cd docs && make html && make doctest

.PHONY: publish
publish:
	cd scripts && publish.sh && doc-deploy.sh

.PHONY: dev
dev:
	$(python) opentrons/server/main.py -P 31950 opentrons.server.main:init

.PHONY: wheel
wheel:
	$(python) setup.py bdist_wheel && \
	ls dist

.PHONY: push
push: wheel
	curl -X POST \
		-H "Content-Type: multipart/form-data" \
		-F 'whl=@dist/`ls dist | grep whl`' \
		http://\[fd00:0:cafe:fefe::1\]/server/update

.PHONY: term
term:
	ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@fd00:0:cafe:fefe::1

.PHONY: clean
clean:
	rm -rf \
		__pycache__ \
		*.egg-info \
		build \
		dist \
		calibrations \
		.coverage
	find . -name "*.pyc" -delete && find . -type d -name __pycache__ -delete
