import 'cypress-file-upload'
import cloneDeep from 'lodash/cloneDeep'
import { expectDeepEqual } from '@opentrons/shared-data/js/cypressUtils'

describe('Protocol fixtures migrate and match snapshots', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnnouncementModal()
  })

  const testCases = [
    {
      title: 'preFlexGrandfatheredProtocol 1.0.0 -> PD 5.1.x, schema 3',
      importFixture:
        '../../fixtures/protocol/1/preFlexGrandfatheredProtocol.json',
      expectedExportFixture:
        '../../fixtures/protocol/5/preFlexGrandfatheredProtocolMigratedFromV1_0_0.json',
      newLabwareDefsMigrationModal: true,
      unusedPipettes: false,
      exportModalCopy: null,
      genericMigrationModal: false,
    },
    {
      title: 'example_1_1_0 -> PD 5.1.x, schema 3',
      importFixture: '../../fixtures/protocol/1/example_1_1_0.json',
      expectedExportFixture:
        '../../fixtures/protocol/5/example_1_1_0MigratedFromV1_0_0.json',
      newLabwareDefsMigrationModal: true,
      unusedPipettes: true,
      exportModalCopy: null,
      genericMigrationModal: false,
    },
    {
      title: 'doItAllV3 -> PD 5.1.x, schema 3',
      importFixture: '../../fixtures/protocol/3/doItAllV3.json',
      expectedExportFixture: '../../fixtures/protocol/5/doItAllV3.json',
      newLabwareDefsMigrationModal: false,
      unusedPipettes: false,
      exportModalCopy: null,
      genericMigrationModal: false,
    },
    {
      title: 'doItAllV4 -> PD 5.1.x, schema 4',
      importFixture: '../../fixtures/protocol/4/doItAllV4.json',
      expectedExportFixture: '../../fixtures/protocol/5/doItAllV4.json',
      newLabwareDefsMigrationModal: false,
      unusedPipettes: false,
      exportModalCopy:
        'Robot requirements for running module inclusive JSON protocols',
      genericMigrationModal: true,
    },
    {
      title: 'doItAllV5 -> import and re-export should preserve data',
      importFixture: '../../fixtures/protocol/5/doItAllV5.json',
      expectedExportFixture: '../../fixtures/protocol/5/doItAllV5.json',
      newLabwareDefsMigrationModal: false,
      unusedPipettes: false,
      exportModalCopy: 'server version 3.20 or higher',
      genericMigrationModal: false,
    },
    {
      title: 'mix 5.0.x -> should migrate to 5.1.x',
      importFixture: '../../fixtures/protocol/5/mix_5_0_x.json',
      expectedExportFixture: '../../fixtures/protocol/5/mix_5_1_0.json',
      newLabwareDefsMigrationModal: false,
      unusedPipettes: false,
      exportModalCopy: null,
      genericMigrationModal: true,
    },
  ]

  testCases.forEach(
    ({
      title,
      importFixture,
      expectedExportFixture,
      newLabwareDefsMigrationModal,
      unusedPipettes,
      exportModalCopy,
      genericMigrationModal,
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
          cy.get('[data-test="ComputingSpinner"]').should('exist')
          // wait until computation is done before proceeding, with generous timeout
          cy.get('[data-test="ComputingSpinner"]', { timeout: 30000 }).should(
            'not.exist'
          )
        })

        if (genericMigrationModal) {
          cy.get('div')
            .contains(
              'Your protocol was made in an older version of Protocol Designer'
            )
            .should('exist')
          cy.get('button')
            .contains('ok', { matchCase: false })
            .click()
        }

        if (newLabwareDefsMigrationModal) {
          // close migration announcement modal
          cy.get('div')
            .contains('Update protocol to use new labware definitions')
            .should('exist')
          cy.get('button')
            .contains('update protocol', { matchCase: false })
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
              .contains('continue with export', { matchCase: false })
              .click()
          }

          if (exportModalCopy) {
            cy.get('div')
              .contains(exportModalCopy)
              .should('exist')
            cy.get('button')
              .contains('continue', { matchCase: false })
              .click()
          }

          cy.window()
            .its('__lastSavedFileBlob__')
            .should('be.a', 'blob')
            .should(async blob => {
              const blobText = await blob.text()
              const savedFile = JSON.parse(blobText)
              const expectedFile = cloneDeep(expectedExportProtocol)

              assert.match(
                savedFile.designerApplication.version,
                /^5\.1\.\d+$/,
                'designerApplication.version is 5.1.x'
              )
              ;[savedFile, expectedFile].forEach(f => {
                // Homogenize fields we don't want to compare
                f.metadata.lastModified = 123
                f.designerApplication.data._internalAppBuildDate = 'Foo Date'
                f.designerApplication.version = 'x.x.x'
              })

              expectDeepEqual(assert, savedFile, expectedFile)
            })

          cy.window()
            .its('__lastSavedFileName__')
            .should(
              'equal',
              `${expectedExportProtocol.metadata.protocolName}.json`
            )
        })
      })
    }
  )
})
