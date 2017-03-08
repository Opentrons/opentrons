.PHONY: app

app:
	cd app-src &&\
		npm i &&\
		npm run unit &&\
		webpack --out ../api/opentrons/server/templates
