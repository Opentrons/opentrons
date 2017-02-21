.PHONY: api api-install api-test api-lint api-docs api-deploy api-clean

api: api-clean api-install api-lint api-test api-docs api-deploy

api-install:
	pip3 install -r requirements.txt
	python3 setup.py install

api-test:
	nosetests --with-coverage

api-lint:
	pylama

api-docs:
	cd docs && make clean html && make doctest && cd ..

api-deploy:
	cd scripts && ./doc-deploy.sh && cd ..


api-clean:
	rm -rf \
		*.egg-info \
		build/ \
		dist/ \
		calibrations/ \
