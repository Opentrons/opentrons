.PHONY: app-pre-install app-install

app: app-pre-install app-install

app-install:
	./scripts/travis.sh install

app-pre-install:
	./scripts/travis.sh pre-install

app-local:
	python3 scripts/create_env.py &&\
		python3 scripts/build_electron_app_with_builder.py
