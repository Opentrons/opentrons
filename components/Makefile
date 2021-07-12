# opentrons component library makefile

# dev server port
port ?= 6060

# standard targets
#####################################################################

.PHONY: all
all: clean dist

.PHONY: clean
clean:
	yarn --cwd .. shx rm -rf storybook-static

# artifacts
#####################################################################

.PHONY: dist
dist:
	yarn --cwd .. build-storybook

# development
#####################################################################

.PHONY: dev
dev:
	yarn --cwd .. start-storybook --port $(port)
