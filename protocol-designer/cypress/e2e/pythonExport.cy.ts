import { verifyImportProtocolPage } from '../support/Import'
// import { exportSteps } from '../support/pythonExport'
// import { SetupSteps } from '../support/SetupSteps'
// import { StepBuilder } from '../support/StepBuilder'
import { getExportTestFile, ExportTestFilePath } from '../support/TestFiles'
// import { UniversalSteps } from '../support/UniversalSteps'

describe('Import a json and export as a python', () => {
  const exportTestFilePaths = Object.values(ExportTestFilePath) as ExportTestFilePath[];
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnalyticsModal()
    cy.closeReleaseNotesModal()
  })
  
  it('should verify the working function of taking in a json file and exporting as a python file', () => {
      for (let exportProtocol of exportTestFilePaths) {
          const file = getExportTestFile(exportProtocol)
          cy.importProtocol(file.path)
          cy.contains('Confirm').click({force: true})
          verifyImportProtocolPage(file)
          cy.contains('Export protocol').click()
        //   cy.visit('/')
      };
    // const steps = new StepBuilder()
    // steps.execute()
  })
})
