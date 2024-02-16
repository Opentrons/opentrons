# opentrons component library makefile

# dev server port
port ?= 6060

# These variables can be overriden when make is invoked to customize the
# behavior of jest
tests ?=
cov_opts ?= --coverage=true --ci=true --collectCoverageFrom='components/src/**/*.(js|ts|tsx)'
test_opts ?=

# standard targets
#####################################################################

.PHONY: all
all: clean dist

.PHONY: clean
clean:
	pnpm --cwd .. shx rm -rf storybook-static

# artifacts
#####################################################################

.PHONY: dist
dist:
	pnpm --cwd .. build-storybook

.PHONY: lib
lib: export NODE_ENV := production
lib:
	pnpm vite build

# development
#####################################################################

.PHONY: dev
dev:
	pnpm --cwd .. start-storybook --port $(port)

.PHONY: test
test:
	$(MAKE) -C .. test-js-components tests="$(tests)" test_opts="$(test_opts)"

.PHONY: test-cov
test-cov:
	make -C .. test-js-components tests=$(tests) test_opts="$(test_opts)" cov_opts="$(cov_opts)"
