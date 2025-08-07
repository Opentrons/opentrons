// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { TestFile } from './TestFiles'

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
