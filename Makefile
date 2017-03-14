.PHONY: app api-exe

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

api-exe:
	cd api &&\
		make api-win



app-shll:
	cd app-shell &&\
		npm --version &&\
		node --version &&\
		npm config get python &&\
		npm i &&\
		npm run unit-main &&\
		npm run build:frontend &&\
		ls dist/* &&\
		ls releases
