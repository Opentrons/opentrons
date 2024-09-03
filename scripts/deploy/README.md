# Web Project Deploy Process

Our web projects go through the following deploy lifecycle:

1. Cut a new version to place QA artifacts in the sandbox environment
2. After QA, promote the sandbox environment to staging
3. After sanity checks, promote the staging environment to production
4. If anything goes wrong, roll staging or production back to its previous version

This directory contains scripts to perform steps 2, 3, and 4.

## Usage

Before running any of these scripts, the release in question must be tagged and that tag must have been built by Travis and deployed to the sandbox.

**IMPORTANT**: All scripts will do a dryrun by default. **Always** do a dryrun before deploying for real. After you have inspected your dryrun, run the actual deploy by passing the optional `--deploy` flag.

Additionally, the `promote-to-staging` and `promote-to-production` scripts will confirm that you are using the correct AWS profile. At the prompt, enter either `y` to confirm and proceed or `n` to cancel.

### Cut a new version to sandbox

This process is still manual. Check out the commit you would like to release, and:

```shell
git tag -a ${name}@${version} -m "chore(release): ${name} ${version}"
git push --tags
```

- `name` - The name of the project in the monorepo. Make sure this matches the directory name exactly, as it determines what actions are triggered when the tag is pushed.
- `version` - The version to bump to

For example, to bump Protocol Designer to version 3.0.0:

```shell
git tag -a protocol-designer@3.0.0 -m "chore(release): protocol-designer 3.0.0"
git push --tags
```

When the tag is pushed to Travis, it will build the release artifact and place it in:

```shell
http://sandbox.${project_domain}/${name}@${version}

# for the example above
http://sandbox.designer.opentrons.com/protocol-designer@3.0.0/
```

### Promote sandbox to staging

Once the sandbox build has been appropriately tested, you may promote the sandbox build to staging.

```shell
# dryrun
node ./scripts/deploy/promote-to-staging <projectDomain> <tag>

# deploy
node ./scripts/deploy/promote-to-staging <projectDomain> <tag> --deploy
```

- `projectDomain` - The production domain of the given project
- `tag` - The version tag to look for in the sandbox

For example, to deploy version 3.0.0 of Protocol Designer version to staging:

```shell
node ./scripts/deploy/promote-to-staging designer.opentrons.com protocol-designer@3.0.0
```

### Promote staging to production

When the version under test is ready for release, you should promote the staging environment to production.

```shell
# dryrun
node ./scripts/deploy/promote-to-production <projectDomain>

# deploy
node ./scripts/deploy/promote-to-production <projectDomain> --deploy
```

- `projectDomain` - The production domain of the given project

For example, to deploy whatever is in Protocol Designer staging to production:

```shell
# dryrun
node ./scripts/deploy/promote-to-production designer.opentrons.com

# deploy
node ./scripts/deploy/promote-to-production designer.opentrons.com --deploy
```

### Rollback

If a release goes poorly, you can roll an environment back to its previous release. Please note that **our rollback depth is 1**. If you need to rollback further, you will need to go through the regular sandbox > staging > production flow with a given tag.

```shell
# dryrun
node ./scripts/deploy/rollback <projectDomain> <environment>

# deploy
node ./scripts/deploy/rollback <projectDomain> <environment> --deploy
```

- `projectDomain` - The production domain of the given project
- `environment` - The environment to roll back, either `staging` or `production`

For example, to rollback Protocol Designer production:

```shell
node ./scripts/deploy/rollback designer.opentrons.com production
```
