# opentrons api makefile

SHELL := /bin/bash

.PHONY: test docs publish clean install dev

install:
	pip install -r requirements.txt && pip install -e .

test:
	python -m pytest \
		--cov=opentrons \
		--cov-report term-missing:skip-covered \
		--cov-report xml:coverage.xml \
		tests

lint:
	python -m pylama opentrons tests

docs:
	cd docs && make html && make doctest

publish:
	cd scripts && publish.sh && doc-deploy.sh

dev:
	python opentrons/server/main.py

clean:
	rm -rf \
		__pycache__ \
		*.egg-info \
		build \
		dist \
		calibrations \
		.coverage
	find . -name "*.pyc" -delete && find . -type d -name __pycache__ -delete
