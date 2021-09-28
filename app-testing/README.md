# Opentrons Installed Run App End to End Testing

> The purpose of this module is to allow tests to run against the installed Electron run app.

Slices of the tests will be selected as candidates for automation and then performed against the Opentrons run app executable on [Windows,Mac,Linux] and various robot configurations [Real Robot, Emulation, No Robot].

## Notes

- This folder is not plugged into the global Make ecosystem of the Opentrons mono repository. This is intentional, the tools in this folder are independent and will likely be used by only a few and are in no way a dependency of any other part of this repository.
- Tests may be run against the linux github runner. Linux is by far the fastest and can use docker-compose to run the robot emulator.

## Steps

1. Have python installed per [CONTRIBUTING.md](../CONTRIBUTING.md)
2. Install the Opentrons application on your machine.
   1. https://opentrons.com/ot-app/
   2. This could also be done by building the installer on a branch and installing the App.
3. Install Chromedriver
   1. in the app-testing directory
      1. `sudo ./ci-tools/mac_get_chromedriver.sh 13.1.8` per the version of electron in the root package.json for electron
         1. if you experience `wget: command not found`
            1. brew install wget and try again
   2. when you run `chromedriver --version`
      1. It should work
      2. It should output the below. The chromedriver version must match Electron version we build into the App.
         1. ChromeDriver 91.0.4472.164 (6c672af59118e1b9f132f26dedbd34fdce3affb1-refs/heads/master@{#883390})
4. Create .env from example.env `cp example.env .env`
   1. Fill in values (if there are secrets)
   2. Make sure the paths work on your machine
5. Install pipenv globally against the python version you are using in this module.
   1. pip install -U pipenv
6. In the app-testing directory (make, python, pipenv required on your path)
   1. `make teardown`
   2. `make setup`
7. Run all tests
   1. `make test`
8. Run specific test(s)
   1. `pipenv run python -m pytest -k test_initial_load_no_robot`
      1. [See docs on pytest -k flag](https://docs.pytest.org/en/6.2.x/usage.html#specifying-tests-selecting-tests)

## Possible ToDo

- Once there is a mass of tests to see the patterns to abstract:
  - Abstract env variables and config file setup into data structures and functions instead of inline?
  - Extend or change the reporting output?
- Mac and Windows github action runners?
- Caching in github action runners?
- Add the option/capability to 'build and install' instead of 'download and install' on runners.
- Define steps for a VM/docker locally for linux runs?
- Define steps for a VM locally for windows runs?
- Better injection of dependencies to relieve import bloat?
- Test case objects describing setup, "test data", test case meta data for tracking?
- Test execution tracking, analysis, links to Zephyr?

## commands

use xdist
`pipenv run pytest -n3`

run black, mypy, and flake8
`make check`

## Tools

python 3.7 - it is a good idea to manage python with [pyenv](https://realpython.com/intro-to-pyenv)
[pipenv](https://pipenv.pypa.io/en/latest/)
