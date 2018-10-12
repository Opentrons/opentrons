# opentrons api makefile

SHELL := /bin/bash

# add yarn CLI dev deps to PATH (for cross platform POSIX commands via shx)
PATH := $(shell cd .. && yarn bin):$(PATH)

# make push wheel file (= rather than := to expand at every use)
wheel = $(wildcard dist/*.whl)
firmware = $(wildcard smoothie/*.hex)

# python and pipenv config
python := pipenv run python
pip := pipenv run pip
pytest := pipenv run py.test
pipenv_opts := --dev
pipenv_opts += $(and $(CI),--ignore-pipfile)

tests ?= tests
test_opts ?=

.PHONY: install
install:
	pipenv install $(pipenv_opts)

.PHONY: all
all: lint test

.PHONY: clean
clean:
	shx rm -rf \
		build \
		dist \
		.coverage \
		coverage.xml \
		'*.egg-info' \
		'**/__pycache__' \
		'**/*.pyc'

.PHONY: test
test: local-install
	${pytest} ${tests} ${test_opts}

.PHONY: lint
lint:
	$(python) -m mypy src/opentrons
	$(python) -m pylama src/opentrons tests

.PHONY: docs
docs:
	pipenv run sphinx-build -b html -d docs/build/doctrees docs/source docs/build/html
	pipenv run sphinx-build -b doctest -d docs/build/doctrees docs/source docs/build/doctest
	shx mkdir -p docs/dist
	shx cp -R docs/build/html/. docs/public/. docs/dist

.PHONY: publish
publish:
	cd scripts && publish.sh && doc-deploy.sh

.PHONY: dev
dev: export ENABLE_VIRTUAL_SMOOTHIE := true
dev: local-install
	$(python) -m opentrons.main -P 31950

.PHONY: wheel
wheel: clean
	$(python) setup.py bdist_wheel
	shx rm -rf build
	shx ls dist

.PHONY: local-install
local-install: wheel
	$(pip) install --ignore-installed --no-deps dist/opentrons-*.whl

.PHONY: local-shell
local-shell: local-install
	pipenv shell

.PHONY: push
push: wheel
	curl -X POST \
		-H "Content-Type: multipart/form-data" \
		-F "whl=@$(wheel)" \
		http://$(host):31950/server/update

.PHONY: flash
flash:
	curl -X POST \
		-H "Content-Type: multipart/form-data" \
		-F "hex=@$(firmware)" \
		http://$(host):31950/server/update/firmware

.PHONY: restart
restart:
	curl -X POST http://$(host):31950/server/restart

.PHONY: change-right
change-right:
	curl -X POST \
		-H "Content-Type: application/json" \
		-d '{"target": "mount", "mount": "right", "point": [65, 40, 30]}' \
		http://$(host):31950/robot/move
	curl -X POST \
		-H "Content-Type: application/json" \
		-d '{"axes": ["c"]}' \
		http://$(host):31950/motors/disengage


.PHONY: change-left
change-left:
	curl -X POST \
		-H "Content-Type: application/json" \
		-d '{"target": "mount", "mount": "left", "point": [325, 40, 30]}' \
		http://$(host):31950/robot/move
	curl -X POST \
		-H "Content-Type: application/json" \
		-d '{"axes": ["b"]}' \
		http://$(host):31950/motors/disengage

# User must currently specify host, e.g.: `make term host=169.254.202.176`
.PHONY: term
term:
	ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no root@$(host)
