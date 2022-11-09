# App environment

> This environment is for cross platform/python testing.

- There is no lockfile, pipenv uses the Pipfile to create the virtual environment.
- No python version is set in the Pipfile, you must set `OT_PYTHON` environment variable with the full path to the python you want if it is not resolved with `python`

## Examples of setting up and then running the api tests against a specific python

### Assuming you have pyenv and the python version installed and enabled in the shell

> To test 3.7

```shell
make -C environments/app setup env OT_PYTHON=$(pyenv which python3.7)
make -C api test-app env OT_PYTHON=$(pyenv which python3.7)
```

> To test 3.10

```shell
make -C environments/app setup env OT_PYTHON=$(pyenv which python3.10)
make -C api test-app env OT_PYTHON=$(pyenv which python3.10)
```
