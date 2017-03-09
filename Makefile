.PHONY: app api-exe

app:
	cd app-src &&\
		npm --version &&\
		node --version &&\
		npm config get python &&\
		npm i &&\
		npm run unit &&\
		webpack --out ../api/opentrons/server/templates

api-exe:
	cd api &&\
		make api


app-shll:
	cd app-shell &&\
		npm --version &&\
		node --version &&\
		npm config get python &&\
		npm i &&\
		npm run unit &&\
		npm run unit-main &&\
		npm run release:posix &&\
		ls dist/* &&\
		ls releases
