# opentrons api makefile

SHELL := /bin/bash

# add yarn CLI dev deps to PATH (for cross platform POSIX commands via shx)
# and also make an explicit version for shx for use in the shell function,
# where PATH won’t be propagated
PATH := $(shell cd .. && yarn bin):$(PATH)
SHX := npx shx

# make push wheel file (= rather than := to expand at every use)
firmware = $(wildcard smoothie/*.hex)

# python and pipenv config
python := pipenv run python
pip := pipenv run pip
pytest := pipenv run py.test
pipenv_opts := --dev
pipenv_opts += $(and $(CI),--keep-outdated --clear)

# Find the version of the wheel from package.json using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the wheel.
wheel_file = dist/opentrons-$(shell $(python) ../scripts/python_build_utils.py api normalize_version)-py2.py3-none-any.whl
wheel_pattern := dist/opentrons-%-py2.py3-none-any.whl

# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/opentrons/tools/test_qc_scripts.py would run only the
# specified test
tests ?= tests
test_opts ?=

# These variables must be overridden when make deploy or make deploy-staging is run
# to set the auth details for pypi
pypi_username ?=
pypi_password ?=

# Host key location for buildroot robot
br_ssh_key ?= ~/.ssh/robot_key
# Other SSH args for buildroot robots
br_ssh_opts ?= -o stricthostkeychecking=no

twine_auth_args := --username $(pypi_username) --password $(pypi_password)


# Source discovery
# For the python sources
ot_py_sources := $(filter %.py,$(shell $(SHX) find src/opentrons/))
# And the out of tree shared data
ot_shared_data_sources := $(filter %.json,$(shell $(SHX) find ../shared-data/))
# And the arbitrary stuff in resources
ot_resources := $(filter %,$(shell $(SHX) find src/opentrons/resources))
modules_configs := $(filter %.rules,$(shell $(SHX) find src/opentrons/config/modules))
ot_sources := $(ot_py_sources) $(ot_shared_data_sources) $(ot_resources) $(modules_configs)

# Defined separately than the clean target so the wheel file doesn’t have to
# depend on a PHONY target
clean_cmd = shx rm -rf build dist .coverage coverage.xml '*.egg-info' '**/__pycache__' '**/*.pyc'

.PHONY: all
all: clean wheel

.PHONY: install
install:
	pipenv sync $(pipenv_opts)

.PHONY: clean
clean:
	$(clean_cmd)

.PHONY: uninstall
uninstall:
	pipenv --rm

$(wheel_pattern): setup.py $(ot_sources)
	$(clean_cmd)
	$(python) setup.py bdist_wheel
	shx rm -rf build
	$(python)	-m twine check $@
	shx ls dist

wheel: $(wheel_file)

.PHONY: test
test: local-install
	$(pytest) $(tests) $(test_opts)

.PHONY: lint
lint: $(ot_py_sources)
	$(python) -m mypy src/opentrons
	$(python) -m pylama src/opentrons tests

.PHONY: docs docs-html docs-doctest docs-pdf

docs-html: local-install
	shx rm -rf docs/build/html
	pipenv run sphinx-build -b html -d docs/build/doctrees docs/source docs/build/html

docs-doctest: local-install
	shx rm -rf docs/build/doctest
	pipenv run sphinx-build -b doctest -d docs/build/doctrees docs/source docs/build/doctest

docs-pdf: local-install
	-shx rm -rf docs/build/pdf
	-pipenv run sphinx-build -b latex -d docs/build/doctrees docs/source docs/build/pdf
	-$(MAKE) -C docs/build/pdf all-pdf

.PHONY: docs
docs: docs-pdf docs-html
	shx mkdir -p docs/dist
	shx cp -R docs/build/html/. docs/public/. docs/dist
	-shx cp docs/build/pdf/OpentronsAPI.pdf docs/dist/_static

.PHONY: publish
publish:
	cd scripts && publish.sh && doc-deploy.sh

.PHONY: dev
dev: export ENABLE_VIRTUAL_SMOOTHIE := true
dev: local-install
	$(python) -m opentrons.main -P 31950

.PHONY: local-install
local-install: wheel
	$(pip) install --ignore-installed --no-deps $(wildcard dist/opentrons-*.whl)

.PHONY: local-shell
local-shell: local-install
	pipenv shell

.PHONY: deploy-staging
deploy-staging: wheel
	-$(python) -m twine upload --repository-url "https://test.pypi.org/legacy/"\
                             $(twine_auth_args)\
                             $(wheel_file)

.PHONY: deploy
deploy: wheel
	$(python) -m twine upload $(twine_auth_args)\
                            $(wheel_file)

.PHONY: push
push: wheel
	curl -X POST \
		-H "Content-Type: multipart/form-data" \
		-F "whl=@$(wildcard dist/opentrons-*.whl)" \
		http://$(host):31950/server/update

.PHONY: push-buildroot
push-buildroot: wheel
	scp -i $(br_ssh_key) $(br_ssh_opts) $(wheel_file) root@$(host):/data/
	ssh -i $(br_ssh_key) $(br_ssh_opts) root@$(host) \
"function cleanup () { rm -f /data/$(wheel_file) && mount -o remount,ro / && systemctl start opentrons-api-server; } ;\
systemctl stop opentrons-api-server &&\
mount -o remount,rw / &&\
cd /usr/lib/python3.7/site-packages &&\
unzip -o /data/opentrons-*.whl && cleanup || cleanup"

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
