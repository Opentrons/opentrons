# opentrons api makefile

SHELL := /bin/bash

.PHONY: test docs publish clean install exe dev push

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
	python opentrons/server/main.py -P 31950

dist/update.base64: clean
	rm -rf dist/* && \
	python setup.py bdist_wheel && \
	tar -C dist -cf /tmp/update . && \
	echo -e "---OT UPDATE BEGIN---" > dist/update.base64 && \
	base64 -i /tmp/update | sed -e "s/.\{50\}/&\n/g" >> dist/update.base64 && \
	echo -e "\n---OT UPDATE END---" >> dist/update.base64

push: dist/update.base64
	curl -F 'data=@dist/update.base64' http://\[fd00:0:cafe:fefe::1\]/upload

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


clean:
	rm -rf \
		__pycache__ \
		*.egg-info \
		build \
		dist \
		calibrations \
		.coverage
	find . -name "*.pyc" -delete && find . -type d -name __pycache__ -delete
