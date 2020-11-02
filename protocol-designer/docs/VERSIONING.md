# Protocol Designer Versioning

PD's versioning isn't semver because PD's main consumer is... PD itself! PD saves protocols that are imported by current and future versions of PD, and PD has full backwards compatibility to load old protocols up to the earliest prototype versions of PD. So there is never any "breaking change" in the sense that compatibility for an older PD version is dropped.

The PD app is versioned `major.minor.patch` where...

- major: This number represents the highest JSON schema version that PD is currently able to export. (Before we added differential export, a given version of PD could only output one JSON schema version, and that was reflected in this major version number, so this was previously more intuitive.)
- minor: must be bumped when a PD import migration is added to PD. This might happen even though nothing visually has changed (usually occurs when a form field is added, removed or modified, or when a new type of data is introduced like `modules` key added to Redux store, which requires a default value)
- patch: any change that is not a JSON schema increment and does not need an import migration. We might do a release with a significant UI change, but still only do a patch bump.

## Understanding PD version vs JSON schema version

Every PD protocol has both a PD version (eg `5.2.1`) and a JSON schema version (eg `4` or equivalently `#/protocol/schemas/4`). They don't represent the same information, and they don't always match.

A PD protocol is a subset of a JSON protocol. You can make a valid JSON protocol that doesn't have PD-specific data, and it will run fine on the robot, but PD will not be able to open it. (Creating and running a non-PD JSON protocol is a niche use case, but it is supported by our stack, and is important to certain users.)

The PD-specific data in a PD protocol is contained in the top-level key `designerApplication`. PD version info is at `designerApplication.version`. The robot server does not read the PD version info of a protocol, it cares only about the JSON schema version. Run App may read PD version but only to display it to the user. This means that PD version is irrelevant to whether you need to update your robot or not to run a protocol.

The JSON schema version is in the top-level key `$otSharedSchema`. The robot server uses this to determine how to execute the protocol. If the protocol has a newer data shape that the (older) robot server does not support, the robot server will see that the JSON schema version is higher than what it knows to support, and will raise an error informing the user to update their robot in order to run the protocol.

## Source of truth for version of PD application

The PD application needs to read its own version to know which migrations to run on imported protocols. Currently, PD's version is stored in `protocol-designer/webpack.config.js` as the const `OT_PD_VERSION` and injected via webpack. The version in `protocol-designer/package.json` should be ignored.

## Import migrations

Upon importing a protocol, PD populates its Redux store with transformed data from the protocol file. Since the Redux store data changes over time, we need to handle importing older protocols when there were different keys, data types, etc. We handle this by having "migrations" where we define functions to transform eg PD version 1.0.0 protocol data to 1.1.0, then 1.1.0 to 2.0.0, and so on up to the latest version. These are in `protocol-designer/src/load-file/migration`.

Because PD migrates protocols when they are imported, if you import a signifcantly older protocol and save it immediately with no changes, the new file may be different because it has passed through the migration process.

Certain migrations can get a special modal associated with them. For example, when you import a couple years old protocol with v1 schema labware, you will get a special 'Update protocol to use new labware definitions' import modal. In most cases, you'll get the generic modal 'Your protocol was made in an older version of Protocol Designer'. (This is handled in `protocol-designer/src/components/modals/FileUploadMessageModal/modalContents.js`)

We usually need to add migrations when we're adding new fields to existing step forms (need to add a default value for the new field), if we modify the data in a form field, or if we add new branches to the Redux tree that are persisted in protocol files (and then need to add default values for those new branches).

## Differential export of schemas

In order to allow users to keep user older versions of the robot software and not be forced to update, PD can export a few different JSON schema versions. For example, if a user has no modules in their protocol, it might be saved as schema X, but upon adding modules it will need to be saved as schema Y, because X does not yet support specifying modules in a JSON protocol. The PD version will be the same in both cases, it's the version of PD that the user has open in their browser when they're saving, and is not conditionally changed like the schema.

This back-compat for older robot server versions is limited and always subject to deprecation. Eventually PD will no longer be able to export schema 3 (or whatever number) protocols, because maintaining the back-compat becomes messy after a certain point.

# Things to consider when bumping the version

- If it's a major or minor bump, E2E tests need to be updated. The E2E migration tests are based on protocol fixtures in `protocol-designer/fixtures/protocol/${protocolDesignerVersionThatCreatedTheProtocol}/${nameOfProtocolFile}.json`. (Because of differential export, the JSON schema of a protocol might be lower than the PD version). The spec itself at `protocol-designer/cypress/integration/migrations.spec.js` needs to be updated(\* see below)
- If it's a major or minor bump, consider whether or not you need a special import modal (see "Import migrations") to communicate noteworthy changes to the user
- If it's a major bump (or a significant minor bump), new fixtures should be added and put in the E2E migration tests

## Relationship to release

Every release should have a version bump. Generally when we feel ready to release, the last PR we do will bump the version and make any related changes including new migrations and adding new migration tests.

## Addendum

The part of `migrations.spec.js` that needs to be updated when there is a major or minor bump is this regex match assert:

```
assert.match(
  savedFile.designerApplication.version,
  /^5\.2\.\d+$/,
  'designerApplication.version is 5.2.x'
)
```
