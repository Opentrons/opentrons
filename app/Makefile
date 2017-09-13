# opentrons app makefile

# use bash
SHELL := bash

# source directories
ui_source := $(shell find ui -type f -name '*' -not -path 'ui/dist/*')
shell_source := $(shell find shell -type f -name '*.js')

# intermediate target files
ui_target := ui/dist/bundle.js

# use devDependency CLIs with $(bin)/command
# set NODE_ENV for a command with $(ENV)=environment
bin := node_modules/.bin
env := $(bin)/cross-env NODE_ENV

# watch and coverage variables for tests
watch ?= false
cover ?= true

ifeq ($(watch), true)
	cover := false
endif

set_package_env := 	$(bin)/cross-env \
	OT_TIME_SUFFIX=$(OT_TIME_SUFFIX) \
	OT_BRANCH_SUFFIX=$(OT_BRANCH_SUFFIX) \
	OT_COMMIT_SUFFIX=$(OT_COMMIT_SUFFIX)

# stardard targets
#####################################################################

.PHONY: all
all: package

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

.PHONY: dist-mac
dist-mac: $(ui_target) $(shell_source)
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
dev:
	$(bin)/concurrently "$(MAKE) dev-server" "$(MAKE) dev-app"

.PHONY: dev-server
dev-server:
	$(env)=development $(bin)/webpack-dev-server --hot

.PHONY: dev-app
dev-app:
	$(env)=development HOT=true electron shell/main.js

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
	$(BIN)/standard --verbose | $(bin)/snazzy

.PHONY: lint-js-fix
lint-js-fix:
	$(BIN)/standard --fix

.PHONY: lint-css
lint-css:
	$(BIN)/stylelint '**/*.css' --verbose

.PHONY: lint-css-fix
lint-css-fix:
	$(BIN)/stylelint '**/*.css' --fix
