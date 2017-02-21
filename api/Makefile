.PHONY: api api-install api-install-deps api-test api-lint api-docs api-deploy api-clean

api: api-clean api-install api-install-deps api-lint api-test api-docs api-deploy

api-install:
	python3 setup.py install

api-install-deps:
	pip3 install -r requirements.txt

api-test:
	nosetests --with-coverage

api-lint:
	pylama

api-docs:
	cd docs && make clean html && make doctest && cd ..

api-deploy:
	cd scripts && ./doc-deploy.sh && cd ..


api-clean:
	echo "Need to write clean command"
