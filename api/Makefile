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


########## [START] RESIN DEVICE ##########

.PHONY: info_device
info_device:
	resin device $(OT_DEVICE_ID)

.PHONY: sync_device
sync_device: clean
	resin sync $(OT_DEVICE_ID) --source ./ --destination /usr/src/api --progress

.PHONY: blink_device
blink_device:
	resin device identify $(OT_DEVICE_ID)

.PHONY: active_devices
active_devices:
	resin devices --app OTone | awk 'NR==1 || /true/'

.PHONY: ssh_device
ssh_device:
	resin ssh $(OT_DEVICE_ID)

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
