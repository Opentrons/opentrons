.PHONY: api api-install api-test api-lint api-docs api-deploy api-clean

api: api-clean api-install api-lint api-test api-docs api-deploy api-wheel

api-install:
	pip install -r requirements.txt
	python setup.py install

api-test:
	nosetests --with-coverage

api-lint:
	pylama

api-docs:
	cd docs && make clean html && make doctest && cd ..

api-deploy:
	cd scripts && ./doc-deploy.sh && cd ..

api-wheel:
	rm ../app/release-assets/*.whl; python setup.py bdist_wheel -d ../app/release-assets
	ls ../app/release-assets/*.whl | xargs -I{} basename {} > ../app/release-assets/whl-name

api-clean:
	rm -rf \
		*.egg-info \
		build/ \
		dist/ \
		calibrations/ \
