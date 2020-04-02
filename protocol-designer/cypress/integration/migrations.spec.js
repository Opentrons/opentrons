import 'cypress-file-upload'
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import isObject from 'lodash/isObject'
import transform from 'lodash/transform'

function difference(object, base) {
  function changes(object, base) {
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

describe('Protocol fixtures migrate and match snapshots', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnnouncementModal()
  })

  it('preFlexGrandfatheredProtocol matches snapshot', () => {
    cy.fixture(
      '../../src/load-file/__tests__/fixtures/throughMigrationV0/preFlexGrandfatheredProtocol.json'
    ).then(fileContent => {
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

    // close migration announcement modal
    cy.get('div')
      .contains('Update protocol to use new labware definitions')
      .should('exist')
    cy.get('button')
      .contains('update protocol')
      .click()

    cy.fixture(
      '../../../shared-data/protocol/fixtures/3/preFlexGrandfatheredProtocolMigratedFromV1_0_0.json'
    ).then(expectedExportProtocol => {
      cy.get('button')
        .contains('Export')
        .click()
        .then(() => {
          const lastSavedFile = cloneDeep(Cypress.env('__lastSavedFile'))
          const expected = cloneDeep(expectedExportProtocol)
          ;[lastSavedFile, expected].forEach(f => {
            // Homogenize fields we don't want to compare
            f.metadata.lastModified = 123
            f.designerApplication.data._internalAppBuildDate = 'Foo Date'
            f.designerApplication.version = 'x.x.x'
          })

          if (!isEqual(lastSavedFile, expected)) {
            throw Error(JSON.stringify(difference(lastSavedFile, expected)))
          }
          assert.deepEqual(lastSavedFile, expected)
        })
    })
  })
})
