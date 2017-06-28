.PHONY: api api-install api-test api-lint api-docs api-deploy api-clean api-valid-exe

api: api-clean api-install api-lint api-test api-docs api-deploy api-exe

api-valid-exe: api-clean api-install api-test api-exe

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

api-wheel:
	rm ../app/release-assets/*.whl; python3 setup.py bdist_wheel -d ../app/release-assets
	ls ../app/release-assets/*.whl | xargs -I{} basename {} > ../app/release-assets/whl-name

api-exe:
	python3 scripts/build_pyinstaller.py

api-clean:
	rm -rf \
		*.egg-info \
		build/ \
		dist/ \
		calibrations/ \
