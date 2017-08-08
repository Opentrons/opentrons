#!/bin/bash
set -v

echo "--------- GIT STATUS ---------"
git status

echo "--------- GIT CHECKOUT + CLEAN ---------"
git checkout .
git clean -fd

# Publish to PyPI
python setup.py sdist bdist_wheel && twine upload dist/*

# Publish to https://anaconda.org/opentrons/opentrons
wget https://repo.continuum.io/miniconda/Miniconda3-latest-Linux-x86_64.sh -O miniconda.sh;
bash miniconda.sh -b -p $HOME/miniconda
export PATH="$HOME/miniconda/bin:$PATH"
hash -r
conda config --set always_yes yes --set changeps1 no
conda update -q conda
conda info -a
conda install anaconda-client conda-build

conda config --set anaconda_upload yes
# Add opentrons channel to look for dependencies that are not maintained by Continuum
conda config --add channels opentrons
anaconda login --username opentrons --password "$ANACONDA_PASSWORD"
conda build conda.recipe
