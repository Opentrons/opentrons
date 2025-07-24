import { getExportTestFile, ExportTestFilePath } from '../support/TestFiles'
import { verifyImportProtocolPage } from '../support/Import'

describe('Import, Export, and Analyze Protocols', () => {
  // Get all the test file paths from your TestFiles helper
  const exportTestFilePaths = Object.values(ExportTestFilePath) as ExportTestFilePath[];

  // Set the path to the downloads folder
  const downloadsFolder = 'cypress/downloads';

  // Runs once before all tests in this describe block.
  // This ensures all exported protocols from the run are collected.
  before(() => {
    // Clean the downloads folder once before the entire test suite runs
    cy.exec(`rm -rf ${downloadsFolder}/*`, { log: true, failOnNonZeroExit: false });
  });

  // Runs before each individual test (it block).
  beforeEach(() => {
    cy.visit('/');
    cy.closeAnalyticsModal();
    cy.closeReleaseNotesModal();
  });

  // Loop through each protocol file to test the full import-export-analyze cycle
  for (const exportProtocol of exportTestFilePaths) {
    it(`should import ${exportProtocol}, export it, and verify with opentrons analyze`, () => {
      const file = getExportTestFile(exportProtocol);
      const protocolName = file.path.split('/').pop(); // Get filename for logging

      // Step 1: Import the JSON protocol
      cy.importProtocol(file.path);
      cy.get('div[aria-label="ModalShell_ModalArea"]')
        .contains('Import').click({ force: true });

      // Step 2: Verify the protocol loaded correctly on the page
      verifyImportProtocolPage(file);

      // Step 3: Export the protocol, which triggers the download
      cy.contains('Export protocol').click();

      // Step 4: Find the most recently downloaded .py file
      cy.exec(`ls -t ${downloadsFolder}/*.py | head -n 1`, { timeout: 10000 })
        .then(({ stdout }) => {
          const downloadedFile = stdout.trim();
          const analysisOutputFile = `${downloadedFile}.analysis.json`;
          cy.log(`Found downloaded file: ${downloadedFile}`);

          // Ensure the file path is not empty using a linter-friendly 'assert' style
          assert.isNotEmpty(downloadedFile, `Failed to find downloaded file for ${protocolName}`);

          // Step 5: Analyze the protocol using the more robust JSON output method.
          // This command will fail the test if analysis returns a non-zero exit code.
          cy.exec(`python -m opentrons.cli analyze ${downloadedFile} --json-output ${analysisOutputFile}`)
            .then(() => {
              // Step 6: Read the generated JSON analysis file and verify its contents.
              cy.readFile(analysisOutputFile).then((analysisResult) => {
                // If errors exist, format them into a concise message for the assertion.
                const errorDetails = (analysisResult.errors || [])
                  .map((error: { detail: string }) => `- ${error.detail}`)
                  .join('\n');
                  
                const errorMessage = `Analysis of ${protocolName} found errors:\n${errorDetails}`;

                // Assert that the errors array is empty using a linter-friendly 'assert' style.
                // If it's not, Cypress will fail the test and display our custom, concise error message.
                assert.strictEqual(analysisResult.errors.length, 0, errorMessage);
              });
            });

          cy.log(`Successfully analyzed ${downloadedFile}`);
        });
    });
  }
});
