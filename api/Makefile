# opentrons api makefile

SHELL := /bin/bash

# add yarn CLI dev deps to PATH (for cross platform POSIX commands via shx)
# and also make an explicit version for shx for use in the shell function,
# where PATH won’t be propagated
yarn_path := $(shell cd .. && yarn bin)
PATH := ${yarn_path}:${PATH}
# Make an explicit version of this for shx so it can be used in the $(shell)
# function, where the PATH won’t be propagated
SHX := ${yarn_path}/shx

# make push wheel file (= rather than := to expand at every use)
firmware = $(wildcard smoothie/*.hex)

# python and pipenv config
python := pipenv run python
pip := pipenv run pip
pytest := pipenv run py.test
pipenv_opts := --dev
pipenv_opts += $(and $(CI),--keep-outdated)

# Find the version of the wheel from package.json using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the wheel.
norm_vers := $(shell ${python} normalized_version.py)
WHEEL_FILE := dist/opentrons-${norm_vers}-py2.py3-none-any.whl

# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/opentrons/tools/test_qc_scripts.py would run only the
# specified test
tests ?= tests
test_opts ?=

# Source discovery
# For the python sources
OT_PY_SOURCES := $(filter %.py,$(shell ${SHX} find src/opentrons/))
# And the out of tree shared data
OT_SHARED_DATA_SOURCES := $(filter %.json,$(shell ${SHX} find ../shared-data/))
# And the arbitrary stuff in resources
OT_RESOURCES := $(filter %,$(shell ${SHX} find src/opentrons/resources))
OT_SOURCES := ${OT_PY_SOURCES} ${OT_SHARED_DATA_SOURCES} ${OT_RESOURCES}
# And the tests
OT_TEST_SOURCES := $(filter-out data/configs% configs/%.json,$(shell %{SHX} find tests/))

# Defined separately than the clean target so the wheel file doesn’t have to
# depend on a PHONY target
CLEAN_CMD = shx rm -rf build dist .coverage coverage.xml '*.egg-info' '**/__pycache__' '**/*.pyc'

.PHONY: install
install:
	pipenv sync $(pipenv_opts)

.PHONY: all
all: lint test

.PHONY: clean
clean:
	${CLEAN_CMD}

${WHEEL_FILE}: setup.py ${OT_SOURCES}
	${CLEAN_CMD}
	$(python) setup.py bdist_wheel
	shx rm -rf build
	shx ls dist

.PHONY: wheel
wheel: ${WHEEL_FILE}

.PHONY: test
test: local-install ${OT_TEST_SOURCES}
	${pytest} ${tests} ${test_opts}

.PHONY: lint
lint: ${OT_PY_SOURCES}
	$(python) -m mypy src/opentrons
	$(python) -m pylama $? src/opentrons tests

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

.PHONY: local-install
local-install: wheel
	$(pip) install --ignore-installed --no-deps dist/opentrons-*.whl

.PHONY: local-shell
local-shell: local-install
	pipenv shell

.PHONY: push
push: wheel
	curl -X POST \
		-H "Conte<nt-Type: multipart/form-data" \
		-F "whl=@${WHEEL_FILE}" \
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
