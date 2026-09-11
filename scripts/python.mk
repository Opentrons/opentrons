# This environment variable can be used to select a specific
# Python executable to use to run pipenv. Note: pipenv will not
# necessary select this Python to create its virtual environments.
OT_PYTHON ?= python

# This environment variable can be used to tell pipenv which
# Python version to use for a project's virtual environment.
# Defaults to Python 3.7, which is the version that runs on the OT-2.
# https://pipenv.pypa.io/en/latest/basics/#specifying-versions-of-python
OT_VIRTUALENV_VERSION ?= 3.12

pipenv_envvars := $(and $(CI),PIPENV_IGNORE_VIRTUALENVS=1)
pipenv := $(pipenv_envvars) $(OT_PYTHON) -m pipenv
python := $(pipenv) run python
pip := $(pipenv) run pip
pytest := $(pipenv) run py.test

pipenv_opts := --dev $(and $(OT_VIRTUALENV_VERSION),--python $(OT_VIRTUALENV_VERSION))
pipenv_opts += $(and $(CI),--clear)
wheel_opts := $(if $(and $(or $(CI),$(V),$(VERBOSE)),$(not $(QUIET))),,-q)
build_wheel_opts := $(if $(and $(or $(CI),$(V),$(VERBOSE)),$(not $(QUIET))),--verbose,)

poetry := poetry
poetry_run := $(poetry) run

pypi_upload_url := https://upload.pypi.org/legacy/
pypi_test_upload_url := https://test.pypi.org/legacy/

ot_project := $(OPENTRONS_PROJECT)
project_rs_default = $(if $(ot_project),$(ot_project),robot-stack)
project_ir_default = $(if $(ot_project),$(ot_project),ot3)

PROJECT = $(project_rs_default)

git_describe_base := git describe --dirty --tags --long --match

# get the appropriate git describe command for a given project
# parameter 1: project
define git_describe_cmd_for_project
$(if $(findstring robot-stack,$(1)),$(git_describe_base)=v[0-9]*.[0-9]*,$(if $(findstring ot3,$(1)),$(git_describe_base)=ot3@*,$(error "Unknown project $(1) (valid: ot3, robot-stack)")))
endef

# get the appropriate tag regex for a given project
# parameter 1: project
define git_tag_regex_for_project
$(if $(findstring robot-stack,$(1)),v(?P<version>.*),$(if $(findstring ot3,$(1)),ot3@(?P<version>.*),$(error "Unknown project $(1) (valid: ot3, robot-stack)")))
endef

# get the full environment variable definition for hatch git describe
# parameter 1: project
define hatch_raw_options_for_project
git_describe_command=$(call git_describe_cmd_for_project,$(1))
endef

# get the python package version
# (evaluates to that string)
# parameter 1: name of the package (aka api, robot-server, etc)
# parameter 2: name of the project
# parameter 3: an extra version tag string
# parameter 4: override python_build_utils.py path (default: ../scripts/python_build_utils.py)
define python_package_version
$(shell $(python) $(if $(4),$(4),../scripts/python_build_utils.py) $(1) $(2) normalize_version $(if $(3),-e $(3)))
endef

# This is the poetry version of python_get_wheelname. Arguments are identical.
define poetry_python_get_wheelname
$(3)-$(call python_package_version,$(1),$(2),$(4),$(5))-py3-none-any.whl
endef

# get the name of the wheel that setup.py will build
# parameter 1: the name of the package (aka api, robot-server, etc)
# parameter 2: the name of the project (aka robot-stack, ot3, etc)
# parameter 3: the name of the python package (aka opentrons, robot_server, etc)
# parameter 4: any extra version tags
# parameter 5: override python_build_utils.py path (default: ../scripts/python_build_utils.py)
define python_get_wheelname
$(3)-$(call python_package_version,$(1),$(2),$(4),$(5))-py3-none-any.whl
endef

# get the name of the sdist that setup.py will build
# parameter 1: the name of the project (aka api, robot-server, etc)
# parameter 2: the name of the python package (aka opentrons, robot_server, etc)
# parameter 3: the name of the project (aka robot-stack, ot3, docs)
# parameter 4: any extra version tags
# parameter 5: override python_build_utils.py path (default: ../scripts/python_build_utils.py)
define python_get_sdistname
$(3)-$(call python_package_version,$(1),$(2),$(4),$(5)).tar.gz
endef

# upload a package to a repository
# parameter 1: auth arguments for twine
# parameter 2: repository url
# parameter 3: the wheel file to upload
# parameter 4: the sdist to upload
define python_upload_package
$(python) -m twine upload $(and $(CI),--verbose) --repository-url $(2) $(1) $(3) $(4)
endef

# Get an enhanced version dict of the project
# parameter 1: name of the package (aka api, robot-server, etc)
# parameter 2: name of the project (aka robot-stack, ot3, etc)
# parameter 3: an extra version tag string
# parameter 4: override python_br_version.py path (default: ../scripts/python_build_utils.py)
define python_get_git_version
$(shell $(python) $(if $(4),$(4),../scripts/python_build_utils.py) $(1) $(2) dump_br_version $(if $(3),-e $(3)))
endef
