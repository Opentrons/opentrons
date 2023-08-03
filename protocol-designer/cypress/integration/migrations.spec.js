import 'cypress-file-upload'
import cloneDeep from 'lodash/cloneDeep'
import { expectDeepEqual } from '@opentrons/shared-data/js/cypressUtils'
const semver = require('semver')

// TODO: (sa 2022-03-31: change these migration fixtures to v6 protocols once the liquids key is added to PD protocols
// https://github.com/Opentrons/opentrons/issues/9852
describe('Protocol fixtures migrate and match snapshots', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnnouncementModal()
  })

  const testCases = [
    {
      title: 'example_1_1_0 (schema 1, PD version 1.1.1) -> PD 7.0.x, schema 7',
      importFixture: '../../fixtures/protocol/1/example_1_1_0.json',
      expectedExportFixture:
        '../../fixtures/protocol/7/example_1_1_0MigratedFromV1_0_0.json',
      unusedPipettes: true,
      migrationModal: 'newLabwareDefs',
    },
    {
      title: 'doItAllV3 (schema 3, PD version 4.0.0) -> PD 7.0.x, schema 7',
      importFixture: '../../fixtures/protocol/4/doItAllV3.json',
      expectedExportFixture:
        '../../fixtures/protocol/7/doItAllV3MigratedToV7.json',
      unusedPipettes: false,
      migrationModal: 'noBehaviorChange',
    },
    {
      title: 'doItAllV4 (schema 4, PD version 4.0.0) -> PD 7.0.x, schema 7',
      importFixture: '../../fixtures/protocol/4/doItAllV4.json',
      expectedExportFixture:
        '../../fixtures/protocol/7/doItAllV4MigratedToV7.json',
      unusedPipettes: false,
      migrationModal: 'noBehaviorChange',
    },
    {
      title: 'doItAllV6 (schema 6, PD version 6.1.0) -> PD 7.0.x, schema 7',
      importFixture: '../../fixtures/protocol/6/doItAllV4MigratedToV6.json',
      expectedExportFixture:
        '../../fixtures/protocol/7/doItAllV4MigratedToV7.json',
      unusedPipettes: false,
      migrationModal: 'noBehaviorChange',
    },
    {
      title:
        'doItAllV7 (schema 7, PD version 7.0.0) -> import and re-export should preserve data',
      importFixture: '../../fixtures/protocol/7/doItAllV4MigratedToV7.json',
      expectedExportFixture:
        '../../fixtures/protocol/7/doItAllV4MigratedToV7.json',
      unusedPipettes: false,
      migrationModal: null,
    },
    {
      title:
        'mix 5.0.x (schema 3, PD version 5.0.0) -> should migrate to 7.0.x, schema 7',
      importFixture: '../../fixtures/protocol/5/mix_5_0_x.json',
      expectedExportFixture: '../../fixtures/protocol/7/mix_7_0_0.json',
      migrationModal: 'noBehaviorChange',
      unusedPipettes: false,
    },
    {
      title:
        'doItAllV7 Flex robot (schema 7, PD version 7.0.0) -> import and re-export should preserve data',
      importFixture: '../../fixtures/protocol/7/doItAllV7.json',
      expectedExportFixture: '../../fixtures/protocol/7/doItAllV7.json',
      migrationModal: false,
      unusedPipettes: false,
    },
  ]

  testCases.forEach(
    ({
      title,
      importFixture,
      expectedExportFixture,
      unusedPipettes,
      migrationModal,
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

        if (migrationModal) {
          if (migrationModal === 'generic') {
            cy.get('div')
              .contains(
                'Updating the file may make changes to liquid handling actions'
              )
              .should('exist')
            cy.get('button').contains('ok', { matchCase: false }).click()
          } else if (migrationModal === 'newLabwareDefs') {
            cy.get('div')
              .contains('Update protocol to use new labware definitions')
              .should('exist')
            cy.get('button')
              .contains('update protocol', { matchCase: false })
              .click()
          } else if (migrationModal === 'noBehaviorChange') {
            cy.get('div')
              .contains(
                'We have added new features since the last time this protocol was updated, but have not made any changes to existing protocol behavior'
              )
              .should('exist')
            cy.get('button').contains('ok', { matchCase: false }).click()
          }
        }

        cy.fixture(expectedExportFixture).then(expectedExportProtocol => {
          cy.get('button').contains('Export').click()

          if (unusedPipettes) {
            cy.get('div').contains('Unused pipette').should('exist')
            cy.get('button')
              .contains('continue with export', { matchCase: false })
              .click()
          }

          cy.get('div')
            .contains(
              'This protocol can only run on app and robot server version 7.0 or higher'
            )
            .should('exist')
          cy.get('button').contains('continue', { matchCase: false }).click()

          cy.window()
            .its('__lastSavedFileBlob__')
            .should('be.a', 'blob')
            .should(async blob => {
              const blobText = await blob.text()
              const savedFile = JSON.parse(blobText)
              const expectedFile = cloneDeep(expectedExportProtocol)
              const version = semver.parse(
                savedFile.designerApplication.version
              )
              assert(
                version != null,
                `PD version ${version} is not valid semver`
              )
              ;[savedFile, expectedFile].forEach(f => {
                // Homogenize fields we don't want to compare
                f.metadata.lastModified = 123
                f.designerApplication.data._internalAppBuildDate = 'Foo Date'
                f.designerApplication.version = 'x.x.x'
                f.commands.forEach(command => {
                  if ('key' in command) {
                    command.key = '123'
                  }
                })
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
