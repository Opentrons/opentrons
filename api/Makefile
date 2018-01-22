# opentrons api makefile

SHELL := /bin/bash

.PHONY: install
install:
	pipenv install --ignore-pipfile --system --dev

.PHONY: test
test:
	python -m pytest \
		--cov=opentrons \
		--cov-report term-missing:skip-covered \
		--cov-report xml:coverage.xml \
		tests

.PHONY: lint
lint:
	python -m pylama opentrons tests

.PHONY: docs
docs:
	cd docs && make html && make doctest

.PHONY: publish
publish:
	cd scripts && publish.sh && doc-deploy.sh

.PHONY: dev
dev:
	python opentrons/server/main.py -P 31950 opentrons.server.main:init

dist/update.base64: clean
	rm -rf dist/* && \
	python setup.py bdist_wheel && \
	tar -C dist -cf /tmp/update . && \
	echo -e "---OT UPDATE BEGIN---" > dist/update.base64 && \
	base64 -i /tmp/update | sed -e "s/.\{50\}/&\n/g" >> dist/update.base64 && \
	echo -e "\n---OT UPDATE END---" >> dist/update.base64

.PHONY: push
push: dist/update.base64
	curl -F 'data=@dist/update.base64' http://\[fd00:0:cafe:fefe::1\]/upload

.PHONY: term
term:
	ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@fd00:0:cafe:fefe::1

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
