# Opentrons Installed Run App End to End Testing

> The purpose of this module is to allow tests to run against the installed Electron run app.

Slices of the tests will be selected as candidates for automation and then performed against the Opentrons run app executable on [Windows,Mac,Linux] and various robot configurations [Real Robot, Emulation, No Robot].

## Notes

- This folder is **not** plugged into the global Make ecosystem of the Opentrons mono repository. This is intentional, the tools in this folder are independent and will likely be used by only a few and are in no way a dependency of any other part of this repository.

## Steps

1. Have pyenv installed per [DEV_SETUP.md](../DEV_SETUP.md)
   1. Install python 3.12
2. Install the Opentrons application on your machine.
   1. <https://opentrons.com/ot-app/>
   2. This could also be done by building the installer on a branch and installing the App.
      1. for Mac
         1. `make -C app-shell dist-osx`
3. Install Chromedriver
   1. in the app-testing directory
   2. `sudo ./citools/{YOUR_OS}_get_chromedriver.sh 21.3.1` passing the version of electron in the repository root [package.json](`/opentrons/package.json`) for electron
   3. windows example using sudo (scoop install sudo): `sudo .\citools\windows_get_chromedriver.ps1 21.3.1`
   4. run `chromedriver --version` to verify
4. Create .env from example.env `cp example.env .env`
   1. Fill in values (if there are secrets)
   2. Make sure the paths work on your machine
5. Install pipenv globally against the python version you are using in this module.
   1. pip install -U pipenv
   2. note: the rest of the monorepo uses pipenv but pinned at `pipenv==2021.5.29`
6. In the app-testing directory (make, python, pipenv required on your path)
   1. `make teardown`
   2. `make setup`
7. Run all tests
   1. `make test`
8. Run specific test(s)
   1. `pipenv run python -m pytest -k protocol_analyze_test`
      1. [See docs on pytest -k flag](https://docs.pytest.org/en/7.4.x/usage.html#specifying-tests-selecting-tests)

## Tools

python 3.12.0 - manage python with [pyenv](https://realpython.com/intro-to-pyenv)
[pipenv](https://pipenv.pypa.io/en/latest/)

## Locator Tool

Using the python REPL we can launch the app and in real time compose element locator strategies.
Then we can execute them, proving they work.
This alleviates having to run tests over and over to validate element locator strategies.

> Using this tool is imperative to reduce time of development when creating/troubleshooting element locators.

From the app-testing directory

```bash
pipenv run python -i locators.py
```

- `clean_exit()` should be used to exit the REPL.
- when you add a new Page Object (PO) you must add it to the imports, list of POs, and reload method so that you can change it and then call `reload()` to use the changes without exiting and restarting the REPL.
- `reload()` will allow the app to stay open but changes in your PO to be reflected.

> sometimes chromedriver does not cleanly exit.
> `pkill -x chromedriver`

## Gotchas

- Only have 1 robot connected at once.
  - Build locators like you have more than 1 to future proof.

## Analysis Test

The analysis test `pipenv run pytest -k test_analyses` is driven by the comma delimited string variable `APP_ANALYSIS_TEST_PROTOCOLS` in `.env`
This allows us to run one or many.

### Adding protocols to the analysis test

1. add the protocol file named according to the naming convention in the files/protocols appropriate folder
1. add the protocol stem to `protocol_files.py`
1. add the protocol data as a property to `protocols.py`
1. run `make print-protocols`

### Analyses Snapshot Test

- run the Workflow Dispatch job
  - `gh workflow run 'Analyses Snapshot Test' --ref 7.1-analyses-battery -f TARGET=v7.1.0-alpha.10 -f TEST_SOURCE=7.1-analyses-battery`
