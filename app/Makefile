# opentrons app makefile

# use bash
SHELL := bash

# source files
ui_source := $(shell find ui -type f -name '*' -not -path 'ui/dist/*')
shell_source := $(shell find shell -type f -name '*.js')

# intermediate target files
ui_target := ui/dist/bundle.js

# use devDependency CLIs with $(bin)/command
# set NODE_ENV for a command with $(env)=environment
bin := node_modules/.bin
env := $(bin)/cross-env NODE_ENV

# dev server port
port ?= 8090

# watch, coverage, and fix variables for tests and linting
watch ?= false
cover ?= true
fix ?= false

ifeq ($(watch), true)
	cover := false
endif

set_package_env := $(bin)/cross-env \
	OT_TIME_SUFFIX=$(OT_TIME_SUFFIX) \
	OT_BRANCH_SUFFIX=$(OT_BRANCH_SUFFIX) \
	OT_COMMIT_SUFFIX=$(OT_COMMIT_SUFFIX)

# stardard targets
#####################################################################

.PHONY: all
all: clean package

.PHONY: install
install:
	npm install

.PHONY: uninstall
uninstall:
	rm -rf node_modules

.PHONY: clean
clean:
	rm -rf coverage dist ui/dist

# artifacts
#####################################################################

$(ui_target): $(ui_source)
	$(env)=production $(bin)/webpack --profile

.PHONY: package
package: $(ui_target) $(shell_source)
	$(set_package_env) $(bin)/electron-builder --dir

.PHONY: dist-osx
dist-osx: $(ui_target) $(shell_source)
	$(set_package_env) $(bin)/electron-builder --mac --publish never

.PHONY: dist-linux
dist-linux: $(ui_target) $(shell_source)
	$(set_package_env) $(bin)/electron-builder --linux --publish never

.PHONY: dist-win
dist-win: $(ui_target) $(shell_source)
	$(set_package_env) $(bin)/electron-builder --win --x64 --publish never

# development
#####################################################################

.PHONY: dev
dev: clean
	$(bin)/concurrently \
		"$(MAKE) dev-server" \
		"$(MAKE) dev-mdns" \
		"sleep 3 && $(MAKE) dev-app" \


.PHONY: dev-server
dev-server:
	$(env)=development PORT=$(port) $(bin)/webpack-dev-server --hot

.PHONY: dev-app
dev-app:
	$(env)=development PORT=$(port) $(bin)/electron shell/main.js

# TODO(mc, 2017-10-31): remove when API is capable of advertising itself
.PHONY: dev-mdns
dev-mdns:
	$(env)=development node scripts/advertise-local-api.js

# checks
#####################################################################

.PHONY: test
test: test-unit
	$(MAKE) lint

.PHONY: test-unit
test-unit:
	$(env)=test $(bin)/jest '.*\.test\.js' --coverage=$(cover) --watch=$(watch)

.PHONY: lint
lint: lint-js lint-css

.PHONY: lint-js
lint-js:
	$(bin)/standard --verbose --fix=$(fix) | $(bin)/snazzy

.PHONY: lint-css
lint-css:
	$(bin)/stylelint '**/*.css' --fix=$(fix) --verbose
