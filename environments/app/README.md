# App environment

> This environment is for cross platform/python testing.

- There is no lockfile, pipenv uses the Pipfile to create the virtual environment.
- No python version is set in the Pipfile, you must set `OT_PYTHON` environment variable with the full path to the python you want if it is not resolved with `python`

## See what targets use this environment in Makefiles

Search for `,app` in `*Makefile`

## Examples of setting up and then running the api tests against a specific python

### Assuming you have pyenv, 3.7, 3.10, and enabled in the shell with pyenv

> To test 3.7

```shell
make install-pipenv OT_PYTHON=python3.7
make -C environments/app setup OT_PYTHON=python3.7
make -C api test-app OT_PYTHON=python3.7
```

> To test 3.10

```shell
make install-pipenv OT_PYTHON=python3.10
make -C environments/app setup OT_PYTHON=python3.10
make -C api test-app OT_PYTHON=python3.10
```
