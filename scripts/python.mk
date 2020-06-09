pipenv_envvars := $(and $(CI),PIPENV_IGNORE_VIRTUALENVS=1)
python := $(pipenv_envvars) pipenv run python
pip := $(pipenv_envvars) pipenv run pip
pytest := $(pipenv_envvars) pipenv run py.test

pipenv_opts := --dev
pipenv_opts += $(and $(CI),--keep-outdated --clear)
wheel_opts := $(if $(and $(or $(CI),$(V),$(VERBOSE)),$(not $(QUIET))),,-q)

pypi_upload_url := https://upload.pypi.org/legacy/
pypi_test_upload_url := https://test.pypi.org/legacy/

# get the python package version
# (evaluates to that string)
# parameter 1: name of the project (aka api, robot-server, etc)
# parameter 2: an extra version tag string
define python_package_version
$(shell $(python) ../scripts/python_build_utils.py $(1) normalize_version $(if $(2),-e $(2)))
endef


# get the name of the wheel that setup.py will build
# parameter 1: the name of the project (aka api, robot-server, etc)
# parameter 2: the name of the python package (aka opentrons, robot_server, etc)
# parameter 3: any extra version tags
define python_get_wheelname
$(2)-$(call python_package_version,$(1),$(3))-py2.py3-none-any.whl
endef

# upload a package to a repository
# parameter 1: auth arguments for twine
# parameter 2: repository url
# parameter 3: the wheel file to upload
# parameter 4 (optional): a prefix command, like changing directory
define python_upload_package
$(if $(4),$(4) &&)$(python) -m twine upload --repository-url $(2) $(1) $(3)
endef
