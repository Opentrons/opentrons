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
      title: 'example_1_1_0 (schema 1, PD version 1.1.1) -> PD 8.0.x, schema 8',
      importFixture: '../../fixtures/protocol/1/example_1_1_0.json',
      expectedExportFixture:
        '../../fixtures/protocol/8/example_1_1_0MigratedToV8.json',
      unusedPipettes: true,
      migrationModal: 'newLabwareDefs',
    },
    {
      title: 'doItAllV3 (schema 3, PD version 4.0.0) -> PD 8.0.x, schema 8',
      importFixture: '../../fixtures/protocol/4/doItAllV3.json',
      expectedExportFixture:
        '../../fixtures/protocol/8/doItAllV3MigratedToV8.json',
      unusedPipettes: false,
      migrationModal: 'v8',
    },
    {
      title: 'doItAllV4 (schema 4, PD version 4.0.0) -> PD 8.0.x, schema 8',
      importFixture: '../../fixtures/protocol/4/doItAllV4.json',
      expectedExportFixture:
        '../../fixtures/protocol/8/doItAllV4MigratedToV8.json',
      unusedPipettes: false,
      migrationModal: 'v8',
    },
    {
      title:
        'doItAll78MigratedToV8 (schema 7, PD version 8.0.0) -> should migrate to 8.0.x, schema 8',
      importFixture: '../../fixtures/protocol/7/doItAllV7.json',
      expectedExportFixture:
        '../../fixtures/protocol/8/doItAllV7MigratedToV8.json',
      unusedPipettes: false,
      migrationModal: 'v8',
    },
    {
      title:
        'mix 5.0.x (schema 3, PD version 5.0.0) -> should migrate to 8.0.x, schema 8',
      importFixture: '../../fixtures/protocol/5/mix_5_0_x.json',
      expectedExportFixture: '../../fixtures/protocol/8/mix_8_0_0.json',
      migrationModal: 'v8',
      unusedPipettes: false,
    },
    {
      title: '96-channel full and column schema 8 -> reimported as schema 8',
      importFixture:
        '../../fixtures/protocol/8/ninetySixChannelFullAndColumn.json',
      expectedExportFixture:
        '../../fixtures/protocol/8/ninetySixChannelFullAndColumn.json',
      migrationModal: null,
      unusedPipettes: false,
    },
    {
      title: 'doItAllV8 flex robot -> reimported, should not migrate',
      importFixture: '../../fixtures/protocol/8/doItAllV8.json',
      expectedExportFixture: '../../fixtures/protocol/8/doItAllV8.json',
      migrationModal: null,
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
          cy.get('[data-test="ComputingSpinner"]'),
            { timeout: 5000 }.should('exist')
          // wait until computation is done before proceeding, with generous timeout
          cy.get('[data-test="ComputingSpinner"]', { timeout: 30000 }).should(
            'not.exist'
          )
        })

        if (migrationModal) {
          if (migrationModal === 'v8') {
            cy.get('div')
              .contains('Protocol Designer no longer supports aspirate or mix')
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
              'This protocol can only run on app and robot server version 7.1 or higher'
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

                //  NOTE: trash stubs can be removed post-8.0.0 release
                //  currently stubbed because of the newly created trash id for movable trash support
                Object.values(
                  f.designerApplication.data.savedStepForms
                ).forEach(stepForm => {
                  if (stepForm.stepType === 'moveLiquid') {
                    stepForm.dropTip_location = 'trash drop tip location'
                    if (stepForm.blowout_location?.includes('trashBin')) {
                      stepForm.blowout_location = 'trash blowout location'
                    }
                  }
                  if (stepForm.stepType === 'mix') {
                    stepForm.dropTip_location = 'trash drop tip location'
                    stepForm.blowout_location = 'trash blowout location'
                  }
                })
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
