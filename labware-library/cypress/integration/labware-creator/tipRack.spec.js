import 'cypress-file-upload'
import { expectDeepEqual } from '@opentrons/shared-data/js/cypressUtils'

const expectedExportFixture = '../fixtures/generic_1_tiprack_20ul.json'

describe('Create a Tip Rack', () => {
  before(() => {
    cy.visit('/create')
    cy.viewport('macbook-15')
    cy.contains('NO').click({ force: true })
  })
  it('Tip Rack Selection from drop down', () => {
    cy.get('label')
      .contains('What type of labware are you creating?')
      .children()
      .first()
      .trigger('mousedown')
    cy.get('*[class^="Dropdown__option_label"]').contains('Tip Rack').click()
    cy.get('button').contains('start creating labware').click({ force: true })
  })

  it('Custom Tip Racks Are Not Recommended', () => {
    cy.get('#CustomTiprackWarning p')
      .first()
      .contains(
        'Opentrons tip racks are recommended for use with the OT-2 because they are specifically designed and verified for automation.'
      )
      .should('exist')
    cy.get('#CustomTiprackWarning p')
      .eq(1)
      .contains(
        'Third party tips can fit, but not necessarily with a tight seal. You risk tips falling off mid-run as well as pipetting inaccuracy. They may also be more likely to bend or break.'
      )
      .should('exist')
  })

  it('Verify Hand-Placed Tip Fit section', () => {
    cy.get('#HandPlacedTipFit h2')
      .contains('Hand-Placed Tip Fit')
      .should('exist')

    // Verify the copy changes for Hand-Placed Tip Fit section
    cy.get('#HandPlacedTipFit p')
      .contains(
        'Place the tip on the pipette you wish to use it on. Give the tip a wiggle to check the fit.'
      )
      .should('exist')
    cy.get('#HandPlacedTipFit p')
      .eq(1)
      .contains(
        'Note that fit may vary between Single and 8 Channel pipettes, as well as between generations of the same pipette.'
      )
      .should('exist')

    // verify that the default neither snug or loosefit is selected.
    cy.get('#HandPlacedTipFit input').should('have.value', '')

    // verify that fit is required
    cy.get('#HandPlacedTipFit input').first().click()
    cy.get('#HandPlacedTipFit p').first().click()
    cy.get('#HandPlacedTipFit span')
      .contains('Fit is a required field')
      .should('exist')

    // verify that loose option is selected
    cy.get('#HandPlacedTipFit input')
      .first()
      .type('Loose', { force: true })
      .type('{enter}')

    cy.get('#HandPlacedTipFit span')
      .contains(
        'If your tip does not fit when placed by hand then it is not a good candidate for this pipette on the OT-2.'
      )
      .should('exist')
    // verify that snug option is selected
    cy.get('#HandPlacedTipFit input')
      .first()
      .type('Snug', { force: true })
      .type('{enter}')

    cy.get('#HandPlacedTipFit span')
      .contains(
        'If your tip seems to fit when placed by hand it may work on the OT-2. Proceed through the form to generate a definition. Once you have a definition you can check performance on the robot.'
      )
      .should('exist')
  })

  it('Verify Total Footprint section', () => {
    cy.get('#Footprint h2').contains('Total Footprint').should('exist')

    // verify the copy changes in the Total Footprint section
    cy.get('#Footprint p')
      .contains('If your Tip Rack has an adapter, place it in the adapter.')
      .should('exist')
    cy.get('#Footprint p')
      .eq(1)
      .contains('Ensure measurement is taken from the very bottom of labware.')
      .should('exist')
    cy.get('#Footprint p')
      .eq(2)
      .contains(
        'The footprint measurement helps determine if the labware (in adapter if needed) fits firmly into the slots on the OT-2 deck.'
      )
      .should('exist')

    // verify the image exists in Total Footprint section
    cy.get('img[alt="labware footprint"]').should('exist')

    // Enter the length and width for the Footprint
    cy.get('input[name="footprintXDimension"]').clear().type('127')
    cy.get('input[name="footprintYDimension"]').clear().type('85')
  })

  it('Verify errors in Total Footprint section', () => {
    // verify that length displays error for smaller value
    cy.get('input[name="footprintXDimension"]').clear().type('20')
    cy.get('#Footprint span')
      .contains(
        'Your labware is too small to fit in a slot properly. Please fill out this form to request an adapter.'
      )
      .should('exist')

    // verify that length displays error for larger value
    cy.get('input[name="footprintXDimension"]').clear().type('2000')
    cy.get('#Footprint span')
      .contains(
        'Your labware is too large to fit in a single slot properly. Please fill out this form to request a custom labware definition.'
      )
      .should('exist')

    // verify that width displays error for smaller value
    cy.get('input[name="footprintYDimension"]').clear().type('20')
    cy.get('#Footprint span')
      .contains(
        'Your labware is too small to fit in a slot properly. Please fill out this form to request an adapter.'
      )
      .should('exist')

    // verify that width displays error for larger value
    cy.get('input[name="footprintYDimension"]').clear().type('2000')
    cy.get('#Footprint span')
      .contains(
        'Your labware is too large to fit in a single slot properly. Please fill out this form to request a custom labware definition.'
      )
      .should('exist')

    // entering the valid values for footprint
    cy.get('input[name="footprintXDimension"]').clear().type('127')
    cy.get('input[name="footprintYDimension"]').clear().type('85')
  })

  it('Verify copy error in Total Height section', () => {
    cy.get('#Height h2').contains('Total Height').should('exist')
    cy.get('#Height p')
      .first()
      .contains(
        'Include the adapter and tops of the pipette tips in the measurement.'
      )
      .should('exist')
    cy.get('#Height p')
      .eq(1)
      .contains(
        'The height measurement informs the robot of the top and bottom of your labware.'
      )
      .should('exist')
    cy.get('img[alt="plate or reservoir height"]').should('exist')
    cy.get('input[name="labwareZDimension"]').clear().type('24')
  })

  it('verify the Tip Length section', () => {
    cy.get('#WellBottomAndDepth h2').contains('Tip Length').should('exist')
    cy.get('#WellBottomAndDepth p')
      .contains('Reference the top of the tip to the bottom of the tip.')
      .should('exist')
    cy.get('img[alt="tip length"]').should('exist')
    cy.get('input[name="wellDepth"]').clear().type('12')
  })

  it('verify the Grid section', () => {
    cy.get('#Grid h2').contains('Grid').should('exist')
    cy.get('#Grid p')
      .contains(
        'The grid of tips on your labware is arranged via rows and columns. Rows run horizontally across your labware (left to right). Columns run top to bottom.'
      )
      .should('exist')
    cy.get('img[alt="grid rows and columns"]').should('exist')
    cy.get('input[name="gridRows"]').clear().type('5')
    cy.get('input[name="regularRowSpacing"]').first().click({ force: true })
    cy.get('input[name="gridColumns"]').clear().type('5')
    cy.get('input[name="regularColumnSpacing"]').first().click({ force: true })
  })

  it('Verify copy change for volume', () => {
    cy.get('#Volume h2').contains('Volume').should('exist')
    cy.get('#Volume p')
      .contains('Total maximum volume of each tip.')
      .should('exist')
    cy.get('input[name="wellVolume"]').clear().type('20')
  })

  it('Verify the tip diameter of the tip', () => {
    cy.get('#TipDiameter h2').contains('Tip Diameter').should('exist')
    cy.get('#TipDiameter p')
      .contains('Reference the inside of the tip.')
      .should('exist')
    cy.get('img[alt="circular well diameter"]').should('exist')
    cy.get('input[name="wellDiameter"]').clear().type('10')
  })

  it('Verify the Tip Spacing section', () => {
    cy.get('#WellSpacing h2').contains('Tip Spacing').should('exist')
    cy.get('#WellSpacing p')
      .contains('Spacing is between the center of tips.')
      .should('exist')
    cy.get('#WellSpacing p')
      .eq(1)
      .contains(
        'spacing measurements inform the robot how far away rows and columns are from each other.'
      )
      .should('exist')
    cy.get('img[alt="circular well spacing"]').should('exist')
    cy.get('input[name="gridSpacingX"]').clear().type('15')
    cy.get('input[name="gridSpacingY"]').clear().type('15')
  })

  it('Verify the Grid Offset section', () => {
    cy.get('#GridOffset h2').contains('Grid Offset').should('exist')
    cy.get('#GridOffset p')
      .contains(
        "Find the measurement from the center of tip A1 to the edge of the labware's footprint."
      )
      .should('exist')
    cy.get('#GridOffset p')
      .eq(1)
      .contains(
        "Corner offset informs the robot how far the grid of tips is from the slot's top left corner."
      )
      .should('exist')
    cy.get('img[alt="tip grid offset"]').should('exist')
    cy.get('img[alt="circular well offset"]').should('exist')
    cy.get('input[name="gridOffsetX"]').clear().type('10')
    cy.get('input[name="gridOffsetY"]').clear().type('10')
  })

  it('Verify the Description section', () => {
    cy.get('#Description h2').contains('Description').should('exist')
    cy.get('input[name="brand"]').clear().type('Brand Chalu')
    cy.get('input[name="brandId"]')
      .clear()
      .type('abcd12345!@#$%,efghij6789^&*()')
  })

  it('Verify the File section and enter the file name', () => {
    cy.get('#File h2').contains('File').should('exist')
    cy.get('input[name="displayName"]')
      .clear()
      .type('Brand Chalu 1 Tip Rack 20ul')
    cy.get('input[name="loadName"]').clear().type('generic_1_tiprack_20ul')
  })

  it('Verify the exported file to the fixture', () => {
    cy.fixture(expectedExportFixture).then(expectedExportLabwareDef => {
      cy.get('button').contains('EXPORT FILE').click()

      cy.window()
        .its('__lastSavedBlobZip__')
        .should('be.a', 'blob')
        .should(async blob => {
          const labwareDefText = await blob.async('text')
          const savedDef = JSON.parse(labwareDefText)

          expectDeepEqual(assert, savedDef, expectedExportLabwareDef)
        })

      cy.window()
        .its('__lastSavedFileName__')
        .should('equal', `generic_1_tiprack_20ul.zip`)
    })
  })
  it('verify the too big, too small error', () => {
    cy.get('input[name="gridOffsetY"]').clear().type('24')
    cy.get('#CheckYourWork span')
      .contains(
        'Grid of tips is larger than labware footprint in the Y dimension. Please double check well size, Y Spacing, and Y Offset.'
      )
      .should('exist')
    cy.get('input[name="gridOffsetX"]').clear().type('240')
    cy.get('#CheckYourWork span')
      .contains(
        'Grid of tips is larger than labware footprint in the X dimension. Please double check well size, X Spacing, and X Offset.'
      )
      .should('exist')
  })
})
