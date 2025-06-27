import { verifyImportProtocolPage } from '../support/Import'
// import { exportSteps } from '../support/pythonExport'
// import { SetupSteps } from '../support/SetupSteps'
// import { StepBuilder } from '../support/StepBuilder'
import { getExportTestFile, ExportTestFilePath } from '../support/TestFiles'
import { UniversalSteps } from '../support/UniversalSteps'

describe('Import a json and export as a python', () => {
  const exportTestFilePaths = Object.values(ExportTestFilePath) as ExportTestFilePath[];
  
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnalyticsModal()
    cy.closeReleaseNotesModal()
  })

  for (let exportProtocol of exportTestFilePaths) {
    it('should verify the working function of taking in a json file and exporting as a python file', () => {
          const file = getExportTestFile(exportProtocol)
          cy.importProtocol(file.path)
          cy.get( 'div[aria-label="ModalShell_ModalArea"]')
            .contains('Import').click({force:true})
          verifyImportProtocolPage(file)
          cy.wait(3000)
          cy.contains('Export protocol').click()

          //verification the import page to account for a race condition
          // const steps = new StepBuilder()
          // steps.execute()
        })
    };
})
