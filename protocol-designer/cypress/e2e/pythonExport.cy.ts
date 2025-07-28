import { getExportTestFile, ExportTestFilePath } from '../support/TestFiles';
import { verifyImportProtocolPage } from '../support/Import';

describe('Import, Export, and Analyze Protocols', () => {
  // Get all the test file paths from your TestFiles helper
  const exportTestFilePaths = Object.values(ExportTestFilePath) as ExportTestFilePath[];

  // Set the path to the downloads folder
  const downloadsFolder = 'cypress/downloads';

  // Runs once before all tests in this describe block.
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
      const protocolName = file.path.split('/').pop() ?? 'Unknown Protocol'; // Get filename for logging

      // Step 1: Import the JSON protocol
      cy.importProtocol(file.path);
      cy.get('div[aria-label="ModalShell_ModalArea"]')
        .contains('Import').click({ force: true });

      // Step 2: Verify the protocol loaded correctly on the page
      verifyImportProtocolPage(file);

      // --- ROBUST DOWNLOAD HANDLING ---

      // Get a list of all python files in the downloads folder *before* triggering the download.
      // This gives us a baseline to compare against.
      cy.exec(`find ${downloadsFolder} -name "*.py"`, { failOnNonZeroExit: false })
        .then(({ stdout: filesBeforeDownload }) => {
          // Step 3: Export the protocol, which triggers the asynchronous download
          cy.contains('Export protocol').click();

          // Step 4: Poll the downloads folder until a new file appears.
          // The .should() command makes Cypress retry cy.exec until the assertion passes or it times out.
          // This is the key to reliably waiting for the download to complete.
          cy.exec(`find ${downloadsFolder} -name "*.py"`, { timeout: 15000 })
            .should('not.eq', filesBeforeDownload)
            .then(({ stdout: filesAfterDownload }) => {
              // Now that a new file exists, determine its exact name by comparing
              // the file list from before and after the download.
              const filesBefore = filesBeforeDownload.split('\n').filter(f => f.length > 0);
              const filesAfter = filesAfterDownload.split('\n').filter(f => f.length > 0);
              const newFile = filesAfter.filter(f => !filesBefore.includes(f))[0];

              // Ensure we successfully identified the newly downloaded file.
              assert.isDefined(newFile, `Failed to find newly downloaded file for ${protocolName}`);
              const downloadedFile = newFile.trim();
              cy.log(`Found downloaded file: ${downloadedFile}`);

              // --- ANALYSIS OF THE DOWNLOADED FILE ---

              const analysisOutputFile = `${downloadedFile}.analysis.json`;

              // Step 5: Analyze the protocol with a longer timeout for complex analyses.
              cy.exec(`python -m opentrons.cli analyze "${downloadedFile}" --json-output "${analysisOutputFile}"`, { timeout: 60000 })
                .then(() => {
                  // Step 6: Read the generated JSON analysis file and verify its contents.
                  cy.readFile(analysisOutputFile).then((analysisResult) => {
                    // If errors exist, format them into a concise message for the assertion.
                    const errorDetails = (analysisResult.errors ?? [])
                      .map((error: { detail: string }) => `- ${error.detail}`)
                      .join('\n');
                      
                    const errorMessage = `Analysis of ${protocolName} found errors:\n${errorDetails}`;

                    // Assert that the errors array is empty.
                    assert.strictEqual(analysisResult.errors.length, 0, errorMessage);
                  });
                });

              cy.log(`Successfully analyzed ${downloadedFile}`);
            });
        });
    });
  }
});
