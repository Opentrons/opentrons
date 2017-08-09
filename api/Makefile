SHELL:=/bin/bash

.PHONY: test docs publish clean install exe dev

install:
	git submodule update --init --recursive &&\
	git submodule update --remote &&\
	python setup.py install && pip install -r requirements.txt

test:
	export APP_DATA_DIR="${TMPDIR:=${TMP:-$(CDPATH=/var:/; cd -P tmp)}}" &&\
		pylama opentrons tests/opentrons && py.test --cov &&\
		tests/gcode/gcode.test.sh

docs:
	cd docs && make html && make doctest

publish:
	# ./scripts/publish.sh;
	./scripts/doc-deploy.sh

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
		.coverage \
		tests/gcode/results
	find . -name "*.pyc" -delete && find . -type d -name __pycache__ -delete
