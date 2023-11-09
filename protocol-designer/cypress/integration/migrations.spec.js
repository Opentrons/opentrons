import 'cypress-file-upload'
import cloneDeep from 'lodash/cloneDeep'
import { expectDeepEqual } from '@opentrons/shared-data/js/cypressUtils'
import { FLEX_TRASH_DEF_URI, OT_2_TRASH_DEF_URI } from '../../src/constants'
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
      migrationModal: 'generic',
    },
    {
      title: 'doItAllV4 (schema 4, PD version 4.0.0) -> PD 8.0.x, schema 8',
      importFixture: '../../fixtures/protocol/4/doItAllV4.json',
      expectedExportFixture:
        '../../fixtures/protocol/8/doItAllV4MigratedToV8.json',
      unusedPipettes: false,
      migrationModal: 'generic',
    },
    //  TODO(jr, 11/1/23): add a test for v8 migrated to v8 with the deck config commands
    // {
    //   title:
    //     'doItAllV8 (schema 7, PD version 8.0.0) -> import and re-export should preserve data',
    //   importFixture: '../../fixtures/protocol/7/doItAllV4MigratedToV7.json',
    //   expectedExportFixture:
    //     '../../fixtures/protocol/7/doItAllV4MigratedToV7.json',
    //   unusedPipettes: false,
    //   migrationModal: null,
    // },
    {
      title:
        'mix 5.0.x (schema 3, PD version 5.0.0) -> should migrate to 8.0.x, schema 8',
      importFixture: '../../fixtures/protocol/5/mix_5_0_x.json',
      expectedExportFixture: '../../fixtures/protocol/8/mix_8_0_0.json',
      migrationModal: 'generic',
      unusedPipettes: false,
    },
    {
      title: 'doItAll7MigratedToV8 flex robot (schema 8, PD version 8.0.x)',
      importFixture: '../../fixtures/protocol/7/doItAllV7.json',
      expectedExportFixture:
        '../../fixtures/protocol/8/doItAllV7MigratedToV8.json',
      migrationModal: 'generic',
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

                //  NOTE: labwareLocationUpdates, trash stubs can be removed for the release after 8.0.0
                //  currently stubbed because of the newly created trash id for movable trash support
                const labwareLocationUpdate =
                  f.designerApplication.data.savedStepForms
                    .__INITIAL_DECK_SETUP_STEP__.labwareLocationUpdate

                Object.entries(labwareLocationUpdate).forEach(
                  ([labwareId, slot]) => {
                    if (
                      labwareId.includes(OT_2_TRASH_DEF_URI) ||
                      labwareId.includes(FLEX_TRASH_DEF_URI)
                    ) {
                      const trashId = 'trashId'
                      labwareLocationUpdate[trashId] = slot
                      delete labwareLocationUpdate[labwareId]
                    }
                  }
                )

                Object.values(
                  f.designerApplication.data.savedStepForms
                ).forEach(stepForm => {
                  if (stepForm.stepType === 'moveLiquid') {
                    stepForm.dropTip_location = 'trash drop tip location'
                    if (
                      stepForm.blowout_location.includes(OT_2_TRASH_DEF_URI) ||
                      stepForm.blowout_location.includes(FLEX_TRASH_DEF_URI)
                    ) {
                      stepForm.blowout_location = 'trash blowout location'
                    }
                  }
                  if (stepForm.stepType === 'mix') {
                    if (
                      stepForm.labware.includes(OT_2_TRASH_DEF_URI) ||
                      stepForm.labware.includes(FLEX_TRASH_DEF_URI)
                    ) {
                      stepForm.labware = 'trash'
                    }
                    stepForm.dropTip_location = 'trash drop tip location'
                    stepForm.blowout_location = 'trash blowout location'
                  }
                })
                f.commands.forEach(command => {
                  if ('key' in command) {
                    command.key = '123'
                  }
                  if (
                    command.commandType === 'loadLabware' &&
                    command.params.displayName === 'Opentrons Fixed Trash'
                  ) {
                    command.params.labwareId = 'loadTrash'
                  }
                  if (command.commandType === 'dropTip') {
                    command.params.labwareId = 'dropTipLabwareId'
                  }
                  if (
                    (command.commandType === 'aspirate' ||
                      command.commandType === 'dispense' ||
                      command.commandType === 'blowout') &&
                    (command.params.labwareId.includes(OT_2_TRASH_DEF_URI) ||
                      command.params.labwareId.includes(FLEX_TRASH_DEF_URI))
                  ) {
                    command.params.labwareId = 'trash'
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
