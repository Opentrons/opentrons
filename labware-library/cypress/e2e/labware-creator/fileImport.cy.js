const importedLabwareFile = 'TestLabwareDefinition.json'

const flat = 'img[alt*="flat bottom"]'
const round = 'img[alt*="u shaped"]'
const v = 'img[alt*="v shaped"]'

describe('File Import', () => {
  before(() => {
    cy.visit('/')
    cy.get('a[href="/create"]').first().click()
    cy.viewport('macbook-15')
  })

  it('tests the file import flow', () => {
    // import file
    cy.fixture(importedLabwareFile, 'utf8').then(fileJson => {
      const fileContent = JSON.stringify(fileJson)
      cy.get('[class*="file_drop"]').first().upload(
        {
          fileContent,
          fileName: importedLabwareFile,
          mimeType: 'application/json',
          encoding: 'utf8',
        },
        { subjectType: 'drag-n-drop', force: true }
      )
    })

    // verify preview image
    cy.contains('Add missing info to see labware preview').should('not.exist')
    // verify regularity
    cy.get("input[name='homogeneousWells'][value='true']").should('be.checked')
    // verify footprint
    cy.get("input[name='footprintXDimension'][value='127']").should('exist')
    cy.get("input[name='footprintYDimension'][value='85']").should('exist')
    // verify height
    cy.get("input[name='labwareZDimension'][value='5']").should('exist')
    // verify number of rows
    cy.get("input[name='gridRows'][value='3']").should('exist')
    // verify rows are evenly spaced
    cy.get("input[name='regularRowSpacing'][value='true']").should('exist')
    // verify number of columns
    cy.get("input[name='gridColumns'][value='5']").should('exist')
    // verify columns are evenly spaced
    cy.get("input[name='regularColumnSpacing'][value='true']").should('exist')

    // verify volume
    cy.get("input[name='wellVolume'][value='5']").should('exist')
    // verify well shape
    cy.get("input[name='wellShape'][value='circular']").should('exist')
    cy.get("input[name='wellDiameter'][value='5']").should('exist')

    // verify well bottom and depth
    cy.get("input[name='wellBottomShape'][value='flat']").should('exist')
    cy.get(flat).should('exist')
    cy.get(round).should('not.exist')
    cy.get(v).should('not.exist')
    cy.get("input[name='wellDepth'][value='5']").should('exist')

    // verify grid spacing
    cy.get("input[name='gridSpacingX'][value='25']").should('exist')
    cy.get("input[name='gridSpacingY'][value='25']").should('exist')

    // verify grid offset
    cy.get("input[name='gridOffsetX'][value='10']").should('exist')
    cy.get("input[name='gridOffsetY'][value='10']").should('exist')

    // go through file export
    // Brand info
    cy.get("input[name='brand'][value='TestPro']").should('exist')
    cy.get("input[name='brandId'][value='001']").should('exist')

    // File info
    cy.get("input[placeholder='TestPro 15 Well Plate 5 µL']").should('exist')
    cy.get("input[placeholder='testpro_15_wellplate_5ul']").should('exist')

    // All fields present
    cy.get('button[class*="_export_button_"]').click({ force: true })
    cy.contains(
      'Please resolve all invalid fields in order to export the labware definition'
    ).should('not.exist')

    cy.fixture(importedLabwareFile).then(expectedExportLabwareDef => {
      const downloadsFolder = Cypress.config('downloadsFolder')
      // this validates the filename and the contents of the file
      cy.readFile(`${downloadsFolder}/testpro_15_wellplate_5ul.json`).then(
        actualExportLabwareDef => {
          expect(actualExportLabwareDef).to.deep.equal(expectedExportLabwareDef)
        }
      )
    })
  })
})
