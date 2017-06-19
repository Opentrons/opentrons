SHELL:=/bin/bash

.PHONY: test docs publish clean install exe config dev

config: venv

venv:
	virtualenv venv -p python3.5

install:
	source venv/bin/activate && python setup.py install && pip install -r requirements.txt

test:
	source venv/bin/activate && pylama opentrons tests && py.test --cov

docs:
	source venv/bin/activate && cd docs && make html && make doctest

publish:
	source venv/bin/activate && cd scripts && publish.sh && doc-deploy.sh

dev:
	source venv/bin/activate && python opentrons/server/main.py

exe: dist/opentrons-api-server

dist/opentrons-api-server:
	source venv/bin/activate && pyinstaller opentrons-api-server.spec

clean:
	rm -rf \
		*.egg-info \
		build \
		dist \
		calibrations \
		.coverage
