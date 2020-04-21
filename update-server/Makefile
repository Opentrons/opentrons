# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

PATH := $(shell cd .. && yarn bin):$(PATH)
SHX := npx shx

# add yarn CLI dev deps to PATH (for cross platform POSIX commands via shx)
PATH := $(shell cd .. && yarn bin):$(PATH)

pipenv_envvars := $(and $(CI),PIPENV_IGNORE_VIRTUALENVS=1)
python := $(pipenv_envvars) pipenv run python
pipenv_opts := --dev
pipenv_opts += $(and $(CI),--keep-outdated)

port ?= 34000
tests ?= tests
test_opts ?=
wheel_file = dist/*.whl
# Host key location for buildroot robot
br_ssh_key ?= ~/.ssh/robot_key
# Other SSH args for buildroot robots
br_ssh_opts ?= -o stricthostkeychecking=no
# Host key for push-key uploading
pubkey ?= br_ssh_key

# make bootstrap wheel file (= rather than := to expand at every use)
wheel_file = $(wildcard dist/otupdate-*.whl)

.PHONY: install
install:
	$(pipenv_envvars) pipenv sync $(pipenv_opts)

.PHONY: dev
dev: export ENABLE_VIRTUAL_SMOOTHIE := true
dev:
	$(python) -m otupdate --debug --port $(port)

.PHONY: clean
clean:
	$(SHX) rm -rf \
		build \
		dist \
		.coverage \
		coverage.xml \
		'*.egg-info' \
		'**/__pycache__' \
		'**/*.pyc'

.PHONY: test
test:
	$(python) -m pytest $(test_opts) $(tests)

.PHONY: lint
lint:
	$(python) -m pylama otupdate tests
	$(python) -m mypy otupdate

.PHONY: wheel
wheel: clean
	$(python) setup.py bdist_wheel
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: bootstrap
bootstrap: wheel
	curl -X POST \
		-H "Content-Type: multipart/form-data" \
		-F "whl=@$(wheel_file)" \
		http://$(host):31950/server/update/bootstrap

.PHONY: restart
restart:
	curl -X POST http://$(host):31950/server/restart

.PHONY: push
push: wheel
	scp -i $(br_ssh_key) $(br_ssh_opts) $(wheel_file) root@$(host):/data/
	scp -i $(br_ssh_key) $(br_ssh_opts) ./opentrons-update-server.service root@$(host):/data/
	ssh -i $(br_ssh_key) $(br_ssh_opts) root@$(host) \
"function cleanup () { rm -f /data/otupdate*.whl && mount -o remount,ro / && systemctl daemon-reload && systemctl start opentrons-update-server; } ;\
systemctl stop opentrons-update-server &&\
mount -o remount,rw / &&\
cp /data/opentrons-update-server.service /etc/systemd/system/ &&\
cd /usr/lib/python3.7/site-packages &&\
unzip -o /data/otupdate-*.whl && cleanup || cleanup"
