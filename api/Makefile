# opentrons api makefile

SHELL := /bin/bash

.PHONY: test docs publish clean install exe dev info_device sync_device active_devices \
	blink_devices ssh_device acquire_device release_device _check_user

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

info_device:
	resin device $(OT_DEVICE_ID)

sync_device: clean _check_user
	resin sync $(OT_DEVICE_ID) --source ~/OpenTrons/opentrons-api/api \
		--destination /usr/src/api --progress

blink_device:
	resin device identify $(OT_DEVICE_ID)

active_devices:
	resin devices --app OTone | awk 'NR==1 || /true/'

ssh_device: _check_user
	resin ssh $(OT_DEVICE_ID)

acquire_device:
	resin env add OT_USER $(OT_USER_ID) --device $(OT_DEVICE_ID)

release_device:
	$(eval DEVICE_URL = $(shell resin device $(OT_DEVICE_ID) | awk '/DASHBOARD/{print $$3}' | sed 's:/[^/]*$$::'))
	@echo "Release must be done through the Resin dashboard for now"
	@echo "To release the device, delete the OT_USER enviornment variable through the resin dashboard at $(DEVICE_URL)/envvars"
	@#resin env rm OT_USER --device $(OT_DEVICE_ID)

_check_user:
	@echo "verifying device ownership...";
	$(eval DEVICE_USER = $(shell resin envs -v --device $(OT_DEVICE_ID) | awk '/OT_USER/{print $$3}'))
	@if [ $(DEVICE_USER) = $(OT_USER_ID) ]; then\
		echo "device ownership confirmed"; \
	else \
		echo "Device user: $(DEVICE_USER) does not match OT_USER_ID: $(OT_USER_ID)";\
		exit 1;\
  fi

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
