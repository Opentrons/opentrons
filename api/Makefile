# opentrons api makefile

SHELL := /bin/bash

.PHONY: test docs publish clean install exe dev

install:
	python setup.py install && pip install -r requirements.txt

test:
	pylama opentrons tests && py.test \
		--cov=opentrons \
		--cov-report term-missing:skip-covered \
		--cov-report xml:coverage.xml \
		tests

docs:
	cd docs && make html && make doctest

publish:
	cd scripts && publish.sh && doc-deploy.sh

dev:
	python opentrons/server/main.py

exe: dist/opentrons-api-server

dist/opentrons-api-server:
	pyinstaller opentrons-api-server.spec

clean:
	rm -rf \
		__pycache__ \
		*.egg-info \
		build \
		dist \
		calibrations \
		.coverage
	find . -name __pycache__ -type d -print | xargs rm -rf
