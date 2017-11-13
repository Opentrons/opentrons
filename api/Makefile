# opentrons api makefile

SHELL := /bin/bash

.PHONY: test docs publish clean install exe dev

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

exe: dist/opentrons-api-server

dist/opentrons-api-server:
	pyinstaller opentrons-api-server.spec


########## [START] RESIN DEVICE ##########

device_info:
	resin device $(OT_DEVICE_ID)

device_sync:
	resin sync $(OT_DEVICE_ID) -s ~/OpenTrons/opentrons-api/api -d /usr/src/api -p

active_devices:
	resin devices --app OTone | awk 'NR==1 || /true/'

########## [END] RESIN DEVICE ##########


clean:
	rm -rf \
		__pycache__ \
		*.egg-info \
		build \
		dist \
		calibrations \
		.coverage
	find . -name "*.pyc" -delete && find . -type d -name __pycache__ -delete
