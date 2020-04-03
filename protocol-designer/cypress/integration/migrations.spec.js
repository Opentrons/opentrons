import 'cypress-file-upload'
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import isObject from 'lodash/isObject'
import transform from 'lodash/transform'

// TODO IMMEDIATELY: put this somewhere
const difference = (object, base) => {
  const changes = (object, base) => {
    return transform(object, function(result, value, key) {
      if (!isEqual(value, base[key])) {
        result[key] =
          isObject(value) && isObject(base[key])
            ? changes(value, base[key])
            : value
      }
    })
  }
  return changes(object, base)
}

// TODO IMMEDIATELY: put this somewhere
// deepEqual won't always return a diff, Cypress doesn't fully support object diffs :(
// also Cypress doesn't seem to support logging to the console? So throwing the diff as an error instead
const expectDeepEqual = (a, b) => {
  try {
    assert.deepEqual(a, b)
  } catch (e) {
    // visualize undefineds
    const replacer = (key, value) =>
      typeof value === 'undefined' ? '__undefined__' : value
    // TODO IMMEDIATELY: try cy.log(message, args)
    throw Error(
      'Expected deep equal: ' +
        JSON.stringify({ a, b, difference: difference(a, b) }, replacer, 4)
    )
  }
}

describe('Protocol fixtures migrate and match snapshots', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnnouncementModal()
  })

  // TODO IMMEDIATELY: move fixtures from PD to shared-data
  const testCases = [
    {
      title: 'preFlexGrandfatheredProtocol 1.0.0 -> 3.0.x',
      importFixture:
        '../../src/load-file/__tests__/fixtures/throughMigrationV0/preFlexGrandfatheredProtocol.json',
      expectedExportFixture:
        '../../../shared-data/protocol/fixtures/3/preFlexGrandfatheredProtocolMigratedFromV1_0_0.json',
      newLabwareDefsMigrationModal: true,
      unusedPipettes: false,
    },
    {
      title: 'example_1_1_0 -> 3.0.x',
      importFixture:
        '../../../protocol-designer/src/load-file/__tests__/fixtures/v1_1_0/example_1_1_0.json',
      expectedExportFixture:
        '../../../shared-data/protocol/fixtures/3/example_1_1_0MigratedFromV1_0_0.json',
      newLabwareDefsMigrationModal: true,
      unusedPipettes: true,
    },
  ]

  testCases.forEach(
    ({
      title,
      importFixture,
      expectedExportFixture,
      newLabwareDefsMigrationModal,
      unusedPipettes,
    }) => {
      it(title, () => {
        cy.fixture(importFixture).then(fileContent => {
          // TODO(IL, 2020-04-02): `cy.fixture` always parses .json files, though we want the plain text.
          // So we have to use JSON.stringify. See https://github.com/cypress-io/cypress/issues/5395
          // Also, the latest version v4 of cypress-file-upload is too implicit to allow us to
          // use the JSON.stringify workaround, so we're stuck on 3.5.3,
          // see https://github.com/abramenal/cypress-file-upload/issues/175
          cy.get('input[type=file]').upload({
            fileContent: JSON.stringify(fileContent),
            fileName: 'fixture.json',
            mimeType: 'application/json',
            encoding: 'utf8',
          })
        })

        if (newLabwareDefsMigrationModal) {
          // close migration announcement modal
          cy.get('div')
            .contains('Update protocol to use new labware definitions')
            .should('exist')
          cy.get('button')
            .contains('update protocol')
            .click()
        }

        cy.fixture(expectedExportFixture).then(expectedExportProtocol => {
          cy.get('button')
            .contains('Export')
            .click()

          if (unusedPipettes) {
            cy.get('div')
              .contains('Unused pipette')
              .should('exist')
            cy.get('button')
              .contains('CONTINUE WITH EXPORT')
              .click()
          }

          cy.window().then(window => {
            const savedFile = cloneDeep(window.__lastSavedFile__)
            const expected = cloneDeep(expectedExportProtocol)

            assert.match(
              savedFile.designerApplication.version,
              /^3\.0\.\d+$/,
              'designerApplication.version is 3.0.x'
            )
            ;[savedFile, expected].forEach(f => {
              // Homogenize fields we don't want to compare
              f.metadata.lastModified = 123
              f.designerApplication.data._internalAppBuildDate = 'Foo Date'
              f.designerApplication.version = 'x.x.x'
            })

            expectDeepEqual(savedFile, expected)
          })
        })
      })
    }
  )
})
