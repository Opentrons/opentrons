import path from 'path'
import cloneDeep from 'lodash/cloneDeep'
import semver from 'semver'

import { expectDeepEqual } from '@opentrons/shared-data/js/cypressUtils'

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { getTestFile, TestFile, TestFilePath } from './TestFiles'

export interface MigrateTestCase {
  title: string
  importTestFile: TestFilePath
  expectedTestFile: TestFilePath
  showMigrationModal: boolean
}

export const ContentStrings = {
  newLabwareDefs: 'Update protocol to use new labware definitions',
  v8_1: 'The default dispense height is now 1 mm from the bottom of the well',
  v8_5:
    'Your protocol will be automatically updated to the latest version. We recommend making a separate copy of your file before importing.',
  noBehaviorChange:
    'We have added new features since the last time this protocol was updated, but have not made any changes to existing protocol behavior',
  exportButton: 'Export JSON',
  continueButton: 'continue',
  continueWithExport: 'Continue with export',
  migrationModal:
    'Your protocol was made in an older version of Protocol Designer',
  confirmButton: 'Confirm',
  cancelButton: 'Cancel',
  importButton: 'Import',
  protocolMetadata: 'Protocol Metadata',
  instruments: 'Instruments',
  liquidDefinitions: 'Liquid Definitions',
  protocolStartingDeck: 'Protocol Starting Deck',
}

export const LocatorStrings = {
  modalShellArea: '[aria-label="ModalShell_ModalArea"]',
  exportProtocol: `button:contains(${ContentStrings.exportButton})`,
  continueButton: `button:contains(${ContentStrings.continueButton})`,
}

export const verifyOldProtocolModal = (): void => {
  cy.get(LocatorStrings.modalShellArea)
    .should('exist')
    .should('be.visible')
    .within(() => {
      cy.contains(ContentStrings.migrationModal)
        .should('exist')
        .and('be.visible')
      cy.contains(ContentStrings.importButton).should('be.visible')
      cy.contains(ContentStrings.cancelButton).should('be.visible')
      cy.contains(ContentStrings.importButton).click({ force: true })
    })
}

export const verifyImportProtocolPage = (protocol: TestFile): void => {
  cy.readFile(protocol.path).then(protocolRead => {
    cy.contains(ContentStrings.protocolMetadata).should('be.visible')
    cy.contains(ContentStrings.instruments).should('be.visible')
    cy.contains(ContentStrings.protocolStartingDeck).should('be.visible')
    if (!protocolRead.metadata.protocolName) {
      cy.contains('Some name!').should('be.visible')
    } else {
      cy.contains(String(protocolRead.metadata.protocolName)).should(
        'be.visible'
      )
    }
  })
}

export const migrateAndMatchSnapshot = ({
  importTestFile,
  expectedTestFile,
  showMigrationModal,
}: MigrateTestCase): void => {
  const uploadProtocol: TestFile = getTestFile(importTestFile)
  cy.importProtocol(uploadProtocol.path)

  if (showMigrationModal) {
    cy.get('button')
      .contains(ContentStrings.importButton, { matchCase: false })
      .click({ force: true })
  }

  verifyImportProtocolPage(uploadProtocol)
  // cy.contains('Edit protocol').click()

  cy.screenshot('protocol-designer/migration-snapshot', {
    capture: 'viewport',
    overwrite: true,
  })

  cy.get(LocatorStrings.exportProtocol).click({ force: true })

  const expectedProtocol: TestFile = getTestFile(expectedTestFile)

  cy.readFile(expectedProtocol.path).then(expectedProtocolRead => {
    const downloadedFilePath = path.join(
      expectedProtocol.downloadsFolder,
      `${expectedProtocolRead.metadata.protocolName}.json`
    )
    cy.readFile(downloadedFilePath, { timeout: 5000 }).should('exist')
    cy.readFile(downloadedFilePath).then(savedFile => {
      const expectedFile = cloneDeep(expectedProtocolRead)
      const version = semver.parse(
        savedFile.designerApplication.version as string
      )
      assert(version !== null, 'PD version is not valid semver')
      const isBelowVersion850 = semver.lt(version ?? '', '8.5.0')

      const files = [savedFile, expectedFile]
      files.forEach(f => {
        f.metadata.lastModified = 123
        f.designerApplication.data._internalAppBuildDate = 'Foo Date'
        f.designerApplication.version = 'x.x.x'

        const savedStepForms = f.designerApplication.data.savedStepForms
        const initialDeckSetupStep = '__INITIAL_DECK_SETUP_STEP__'

        //  a uuid is randomly generated each time you upload a protocol that is less than version 8_5_0
        //  which is the migration version that adds these keys. Due to this, we need to ignore
        //  the uuids
        if (
          Boolean(savedStepForms[initialDeckSetupStep]) &&
          isBelowVersion850
        ) {
          savedStepForms[initialDeckSetupStep].trashBinLocationUpdate = {
            trashBin: 'trashLocation',
          }
          savedStepForms[initialDeckSetupStep].gripperLocationUpdate = {
            gripper: 'gripperLocation',
          }
        }

        Object.values(savedStepForms as Record<string, unknown>).forEach(
          stepForm => {
            const stepFormTyped = stepForm as {
              stepType: string
              dropTip_location?: string
              blowout_location?: string
            }
            if (stepFormTyped.stepType === 'moveLiquid') {
              stepFormTyped.dropTip_location = 'trash drop tip location'
              if (
                stepFormTyped.blowout_location?.includes('trashBin') ??
                false
              ) {
                stepFormTyped.blowout_location = 'trash blowout location'
              }
            }
            if (stepFormTyped.stepType === 'mix') {
              stepFormTyped.dropTip_location = 'trash drop tip location'
              stepFormTyped.blowout_location = 'trash blowout location'
            }
          }
        )

        f.commands.forEach((command: { key: string }) => {
          if ('key' in command) command.key = '123'
        })
      })

      expectDeepEqual(assert, savedFile, expectedFile)
    })
  })
}
