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

### Analyses Snapshot Test

> The primary test in this module.

The analyses snapshot test runs protocol analysis using `TARGET` branch or tag then compares them against snapshots found on `TEST_SOURCE` branch or tag.

#### Protocol Files Location

The set of protocols to analyze is defined inside of `app-testing/.env` file, under the `APP_ANALYSIS_TEST_PROTOCOLS` and `APP_ANALYSIS_TEST_PROTOCOLS_WITH_OVERRIDES` variables.

#### Protocol Files with Overrides

Sometimes we want to have a bunch of protocols that are just slightly different from each other. This is especially helpful with negative test cases. We can have a protocol that depending on the value of a variable does different things. You may then override the variable to test different scenarios.

The best way to learn this is by example. Look at:

- `app-testing/files/protocolsFlex_X_v2_18_NO_PIPETTES_Overrides_BadTypesInRTP.py`
- `app-testing/automation/data/protocols_with_overrides.py`
- `make generate-protocols`
- see the protocols generated in `app-testing/files/generated_protocols/`

#### Analysis Snapshots Location

Analysis snapshots are located inside of `app-testing/tests/__snapshots__/analyses_snapshot_test` folder. These are generated. If you want to update them, see below.

#### Running Analysis Snapshot Tests Locally

> Note: Passing `TARGET` can be done as below or in the `.env` file.

To run analysis snapshot tests locally, you must first build the Docker image by running the following command:

```bash
TARGET="<target-branch-or-tag>" make build-opentrons-analysis
```

Then to run the analysis snapshot test, you can run the following command:

```bash
TARGET="<target-branch-or-tag>" make snapshot-test
```

This will run the analyses snapshot test using the `TARGET` branch or tag, and compare the results against your local analysis snapshots located inside `app-testing/tests/__snapshots__/analyses_snapshot_test`.

#### Updating Analysis Snapshots

If you want to update the analysis snapshots, you can run the following command:

```bash
TARGET="<target-branch-or-tag>" make snapshot-test-update
```

This will take the results of the analysis snapshot test using the `TARGET` branch or tag, and update the local analysis snapshots located inside `app-testing/tests/__snapshots__/analyses_snapshot_test`.

#### Running Analysis Snapshot Tests on CI

To run analysis snapshot tests on CI, you need to run the `Analyses Snapshot Test` workflow dispatch job. This job requires two inputs, `TARGET` and `TEST_SOURCE`.

Given the scenario that you want to see if the latest version of `chore_release-v7.2.0` release branch has any differences compared to the current analysis snapshots.

`TARGET` - is chore_release-v7.2.0. "I want to run analysis against `chore_release-v7.2.0`"

`TEST_SOURCE` - This one varies a bit on what it can be. The question to ask is, "Where are the snapshots that you want to compare against?"

- If you want to compare against the current analysis snapshots for this release, then TEST_SOURCE is chore_release-v7.2.0.
- If you want to compare against the previous release branch, then TEST_SOURCE is chore_release-v7.1.0.
- If you want to compare your in-progress release branch against the previous release branch, then TEST_SOURCE is `<your-branch-name>`.

##### Run the Workflow Dispatch job

- `gh workflow run 'Analyses Snapshot Test' --ref chore_release-v7.2.0 -f TARGET=chore_release-v7.2.0 -f TEST_SOURCE=chore_release-v7.1.0`
