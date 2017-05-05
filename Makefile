.PHONY: app api-exe app-shell api-valid-exe

app:
	cd app-src &&\
		npm --version &&\
		node --version &&\
		npm config get python &&\
		npm i &&\
		npm run unit &&\
		./node_modules/.bin/webpack --out ../api/opentrons/server/templates

api-exe:
	cd api &&\
		make api

api-valid-exe:
	cd api &&\
		make api-valid-exe

# Note(ahmed) Integration tests do not pass on windows
app-shell: app-shell-setup app-shell-e2e-test app-shell-build
app-shell-win: app-shell-setup app-shell-build

app-shell-setup:
	cd app-shell &&\
		npm --version &&\
		node --version &&\
		npm config get python &&\
		npm i &&\
		npm run unit-main

app-shell-build:
	cd app-shell &&\
		npm run build:frontend &&\
		ls dist/* &&\
		ls releases

app-shell-e2e-test:
	cd app-shell &&\
		npm run e2e
