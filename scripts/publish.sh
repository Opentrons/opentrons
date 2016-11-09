#!/bin/bash
python setup.py sdist bdist_wheel && twine upload dist/*
conda config --set anaconda_upload yes
anaconda login --username opentrons --password '$ANACONDA_PASSWORD'
conda build conda.recipe