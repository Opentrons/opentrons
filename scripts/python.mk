# This environment variable can be used to select a specific
# Python executable to use to run pipenv. Note: pipenv will not
# necessary select this Python to create its virtual environments.
OT_PYTHON ?= python

_firstpath := $(dir $(realpath $(firstword $(MAKEFILE_LIST))))
_possibilities := $(realpath $(_firstpath)/..) $(realpath $(_firstpath)/../..) $(realpath $(_firstpath)/../../..) $(_firstpath)
monorepo_root := $(firstword $(filter %/opentrons, $(_possibilities)))

ifeq ($(CI),true)
	ifeq ($(monorepo_root),)
		monorepo_root := $(firstword $(filter %\opentrons, $(_possibilities)))
		monorepo_root := $(shell cygpath -m $(monorepo_root))
	endif
endif

ifeq ($(OS),Windows_NT)
	ifneq ($(OT_PYTHON),python)
		ifeq ($(CI),true)
			ifneq ($(suffix $(OT_PYTHON)),.exe)
				OT_PYTHON := $(OT_PYTHON).exe
			endif
			OT_PYTHON := $(shell cygpath -m $(OT_PYTHON))
		endif
	endif
endif

# Use legacy editable installs to avoid breaking mypy type-checking
# when using newer versions of setuptools
export SETUPTOOLS_ENABLE_FEATURES := legacy-editable

pipenv_envvars := $(and $(CI),PIPENV_IGNORE_VIRTUALENVS=1)
pipenv_call := $(pipenv_envvars) $(OT_PYTHON) -m pipenv
pipenv = PIPENV_PIPFILE=$(monorepo_root)/environments/$(1)/Pipfile $(pipenv_call)
python = $(call pipenv,$(1)) run python
pip = $(call pipenv,$(1)) run pip
pytest = $(call pipenv,$(1)) run pytest

poetry := poetry
poetry_run := $(poetry) run

pypi_upload_url := https://upload.pypi.org/legacy/
pypi_test_upload_url := https://test.pypi.org/legacy/

# get the python package version
# (evaluates to that string)
# parameter 1: name of the project (aka api, robot-server, etc)
# parameter 2: an extra version tag string
# parameter 3: override python_build_utils.py path (default: ../scripts/python_build_utils.py)
define python_package_version
$(shell python $(if $(3),$(3),../scripts/python_build_utils.py) $(1) normalize_version $(if $(2),-e $(2)))
endef

# This is the poetry version of python_get_wheelname. Arguments are identical.
define poetry_python_get_wheelname
$(2)-$(call python_package_version,$(1),$(3),$(4))-py3-none-any.whl
endef

# get the name of the wheel that setup.py will build
# parameter 1: the name of the project (aka api, robot-server, etc)
# parameter 2: the name of the python package (aka opentrons, robot_server, etc)
# parameter 3: any extra version tags
# parameter 4: override python_build_utils.py path (default: ../scripts/python_build_utils.py)

define python_get_wheelname
$(2)-$(call python_package_version,$(1),$(3),$(4))-py2.py3-none-any.whl
endef

# get the name of the sdist that setup.py will build
# parameter 1: the name of the project (aka api, robot-server, etc)
# parameter 2: the name of the python package (aka opentrons, robot_server, etc)
# parameter 3: any extra version tags
# parameter 4: override python_build_utils.py path (default: ../scripts/python_build_utils.py)

define python_get_sdistname
$(2)-$(call python_package_version,$(1),$(3),$(4)).tar.gz
endef

# upload a package to a repository
# parameter 1: environment
# parameter 2: auth arguments for twine
# parameter 3: repository url
# parameter 4: the wheel file to upload
define python_upload_package
$(call python,$(1)) -m twine upload --repository-url $(3) $(2) $(4)
endef
