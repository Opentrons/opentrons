# opentrons ai server makefile
.PHONY: install-pipenv
install-pipenv:
	python -m pip install --user pipenv==2023.12.1

.PHONY: setup
setup: install-pipenv
	python -m pipenv install --dev --python 3.12.3

.PHONY: teardown
teardown:
	python -m pipenv --rm

.PHONY: black
black:
	python -m pipenv run python -m black .

.PHONY: black-check
black-check:
	python -m pipenv run python -m black . --check

.PHONY: ruff
ruff:
	python -m pipenv run python -m ruff check . --fix

.PHONY: ruff-check
ruff-check:
	python -m pipenv run python -m ruff check .

.PHONY: mypy
mypy:
	python -m pipenv run python -m mypy deploy.py api

.PHONY: format-readme
format-readme:
	yarn prettier --ignore-path .eslintignore --write opentrons-ai-server/**/*.md opentrons-ai-server/**/*.json

.PHONY: lint
lint: black-check ruff-check mypy

.PHONY: format
format: 
	@echo runnning black
	$(MAKE) black
	@echo running ruff
	$(MAKE) ruff
	@echo formatting the readme with yarn prettier
	$(MAKE) format-readme

.PHONY: fixup
fixup: format lint

.PHONY: pre-commit
pre-commit: fixup unit-test install-deps
	@echo "pre-commit checks passed"

.PHONY: gen-env
gen-env:
	python -m pipenv run python api/settings.py

.PHONY: unit-test
unit-test:
	python -m pipenv run python -m pytest tests -m unit

.PHONY: clean-package
clean-package:
	rm -rf package
	rm -f function.zip

.PHONY: gen-requirements
gen-requirements:
	@echo "Generating requirements.txt from Pipfile.lock..."
	python -m pipenv requirements --hash > requirements.txt

.PHONY: install-deps
install-deps:
	@echo "Installing dependencies to package/ directory..."
	mkdir -p package
	python -m pipenv run pip install -r requirements.txt --target ./package --upgrade

.PHONY: package-lambda
package-lambda:
	@echo "Copying source code to package/ directory..."
	mkdir -p package
	cp -r api/. package/api
	@echo "Creating the deployment zip file..."
	cd package && zip -r ../function.zip . && cd ..
	@echo "Package created successfully."

.PHONY: build
build: clean-package install-deps package-lambda

ALLOWED_ENVS := sandbox dev

ENV ?= sandbox

.PHONY: validate-env
validate-env:
	@echo "Validating environment setting: $(ENV)"
	@if ! echo $(ALLOWED_ENVS) | grep -w $(ENV) > /dev/null; then \
		echo "ERROR: Invalid ENV setting '$(ENV)'"; \
		echo "Allowed values are: $(ALLOWED_ENVS)"; \
		exit 1; \
	fi
	@echo "Environment setting is valid: $(ENV)"

AWS_PROFILE = "must be set"

.PHONY: deploy
deploy: validate-env
	@echo "Deploying to environment: $(ENV)"
	python -m pipenv run python deploy.py $(ENV)
