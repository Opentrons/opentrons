SHELL:=/bin/bash

.PHONY: api app shell

api:
	cd api && make config install exe

app:
	cd app && make config install build

shell:
	cd shell && make config install exe
