import { navigateToUrl, wellBottomImageLocator } from '../../support/e2e'

context('Tubes and Rack', () => {
  describe('Six tubes', () => {
    before(() => {
      navigateToUrl('/#/create')
      cy.get('label')
        .contains('What type of labware are you creating?')
        .children()
        .first()
        .trigger('mousedown')
      cy.get('*[class^="_option_label"]').contains('Tubes + Tube Rack').click()

      cy.get('label')
        .contains('Which tube rack?')
        .children()
        .first()
        .trigger('mousedown')
      cy.get('*[class^="_option_label"]').contains('6 tubes').click()

      cy.contains('Start creating labware').click({ force: true })
    })

    it('creates a tuberack with 16 tubes', () => {
      // does not have a preview image
      cy.contains('Add missing info to see labware preview').should('exist')

      // Verify regularity
      cy.get("input[name='homogeneousWells'][value='false']").check({
        force: true,
      })
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('exist')
      cy.get("input[name='homogeneousWells'][value='true']").check({
        force: true,
      })
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('not.exist')

      // Verify height
      cy.get("input[name='labwareZDimension']").type('150').blur()
      cy.contains('This labware may be too tall').should('exist')
      cy.get("input[name='labwareZDimension']").clear().type('200').blur()
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('exist')
      cy.get("input[name='labwareZDimension']").clear().type('75').blur()
      cy.contains('This labware may be too tall').should('not.exist')
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('not.exist')

      // Verify volume
      cy.get("input[name='wellVolume']").focus().blur()
      cy.contains('Volume is a required field').should('exist')
      cy.get("input[name='wellVolume']").type('10').blur()
      cy.contains('Volume is a required field').should('not.exist')

      // Well shape tests

      // circular wells
      cy.get("input[name='wellShape'][value='circular']").check({
        force: true,
      })
      cy.get("input[name='wellDiameter']").should('exist')
      cy.get("input[name='wellXDimension']").should('not.exist')
      cy.get("input[name='wellYDimension']").should('not.exist')
      cy.get("input[name='wellDiameter']").focus().blur()
      cy.contains('Diameter is a required field').should('exist')
      cy.get("input[name='wellDiameter']").type('10').blur()
      cy.contains('Diameter is a required field').should('not.exist')

      // rectangular wells
      cy.get("input[name='wellShape'][value='rectangular']").check({
        force: true,
      })
      cy.get("input[name='wellDiameter']").should('not.exist')
      cy.get("input[name='wellXDimension']").should('exist')
      cy.get("input[name='wellYDimension']").should('exist')
      cy.get("input[name='wellXDimension']").focus().blur()
      cy.contains('Tube X is a required field').should('exist')
      cy.get("input[name='wellXDimension']").type('10').blur()
      cy.contains('Tube X is a required field').should('not.exist')
      cy.get("input[name='wellYDimension']").focus().blur()
      cy.contains('Tube Y is a required field').should('exist')
      cy.get("input[name='wellYDimension']").type('10').blur()
      cy.contains('Tube Y is a required field').should('not.exist')

      // well bottom shape and depth
      cy.get("input[name='wellBottomShape'][value='flat']").check({
        force: true,
      })
      cy.get(wellBottomImageLocator.flat).should('exist')
      cy.get(wellBottomImageLocator.round).should('not.exist')
      cy.get(wellBottomImageLocator.v).should('not.exist')
      cy.get("input[name='wellBottomShape'][value='u']").check({
        force: true,
      })
      cy.get(wellBottomImageLocator.flat).should('not.exist')
      cy.get(wellBottomImageLocator.round).should('exist')
      cy.get(wellBottomImageLocator.v).should('not.exist')
      cy.get("input[name='wellBottomShape'][value='v']").check({
        force: true,
      })
      cy.get(wellBottomImageLocator.flat).should('not.exist')
      cy.get(wellBottomImageLocator.round).should('not.exist')
      cy.get(wellBottomImageLocator.v).should('exist')
      cy.get("input[name='wellDepth']").focus().blur()
      cy.contains('Depth is a required field').should('exist')
      cy.get("input[name='wellDepth']").type('10').blur()
      cy.contains('Depth is a required field').should('not.exist')

      cy.contains('Add missing info to see labware preview').should('not.exist')

      // Verify file export
      // Brand field should not be shown for Opentrons tube rack (aka non-custom)
      cy.contains('Brand is a required field').should('not.exist')

      // File info
      cy.get(
        "input[placeholder='Opentrons 6 Tube Rack with Generic 0.01 mL']"
      ).should('exist')
      cy.get("input[placeholder='opentrons_6_tuberack_10ul']").should('exist')

      // All fields present
      cy.get('button[class*="_export_button_"]').click({ force: true })
      cy.contains(
        'Please resolve all invalid fields in order to export the labware definition'
      ).should('not.exist')
    })
  })

  describe('Fifteen tubes', () => {
    before(() => {
      navigateToUrl('#/create')
      cy.get('label')
        .contains('What type of labware are you creating?')
        .children()
        .first()
        .trigger('mousedown')
      cy.get('*[class^="_option_label"]').contains('Tubes + Tube Rack').click()

      cy.get('label')
        .contains('Which tube rack?')
        .children()
        .first()
        .trigger('mousedown')
      cy.get('*[class^="_option_label"]').contains('15 tubes').click()

      cy.contains('Start creating labware').click({ force: true })
    })

    it('creates a tuberack with 15 tubes', () => {
      cy.contains('Add missing info to see labware preview').should('exist')

      // Verify regularity
      cy.get("input[name='homogeneousWells'][value='false']").check({
        force: true,
      })
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('exist')
      cy.get("input[name='homogeneousWells'][value='true']").check({
        force: true,
      })
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('not.exist')

      // Verify height
      cy.get("input[name='labwareZDimension']").type('150').blur()
      cy.contains('This labware may be too tall').should('exist')
      cy.get("input[name='labwareZDimension']").clear().type('200').blur()
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('exist')
      cy.get("input[name='labwareZDimension']").clear().type('75').blur()
      cy.contains('This labware may be too tall').should('not.exist')
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('not.exist')

      // Verify volume
      cy.get("input[name='wellVolume']").focus().blur()
      cy.contains('Volume is a required field').should('exist')
      cy.get("input[name='wellVolume']").type('10').blur()
      cy.contains('Volume is a required field').should('not.exist')

      // Well shape
      // Verify circular wells
      cy.get("input[name='wellShape'][value='circular']").check({
        force: true,
      })
      cy.get("input[name='wellDiameter']").should('exist')
      cy.get("input[name='wellXDimension']").should('not.exist')
      cy.get("input[name='wellYDimension']").should('not.exist')
      cy.get("input[name='wellDiameter']").focus().blur()
      cy.contains('Diameter is a required field').should('exist')
      cy.get("input[name='wellDiameter']").type('10').blur()
      cy.contains('Diameter is a required field').should('not.exist')

      // Verify rectangular wells
      cy.get("input[name='wellShape'][value='rectangular']").check({
        force: true,
      })
      cy.get("input[name='wellDiameter']").should('not.exist')
      cy.get("input[name='wellXDimension']").should('exist')
      cy.get("input[name='wellYDimension']").should('exist')
      cy.get("input[name='wellXDimension']").focus().blur()
      cy.contains('Tube X is a required field').should('exist')
      cy.get("input[name='wellXDimension']").type('10').blur()
      cy.contains('Tube X is a required field').should('not.exist')
      cy.get("input[name='wellYDimension']").focus().blur()
      cy.contains('Tube Y is a required field').should('exist')
      cy.get("input[name='wellYDimension']").type('10').blur()
      cy.contains('Tube Y is a required field').should('not.exist')

      // verify well bottom shape and depth
      cy.get("input[name='wellBottomShape'][value='flat']").check({
        force: true,
      })
      cy.get(wellBottomImageLocator.flat).should('exist')
      cy.get(wellBottomImageLocator.round).should('not.exist')
      cy.get(wellBottomImageLocator.v).should('not.exist')
      cy.get("input[name='wellBottomShape'][value='u']").check({
        force: true,
      })
      cy.get(wellBottomImageLocator.flat).should('not.exist')
      cy.get(wellBottomImageLocator.round).should('exist')
      cy.get(wellBottomImageLocator.v).should('not.exist')
      cy.get("input[name='wellBottomShape'][value='v']").check({
        force: true,
      })
      cy.get(wellBottomImageLocator.flat).should('not.exist')
      cy.get(wellBottomImageLocator.round).should('not.exist')
      cy.get(wellBottomImageLocator.v).should('exist')
      cy.get("input[name='wellDepth']").focus().blur()
      cy.contains('Depth is a required field').should('exist')
      cy.get("input[name='wellDepth']").type('10').blur()
      cy.contains('Depth is a required field').should('not.exist')

      cy.contains('Add missing info to see labware preview').should('not.exist')

      // Verify the file export
      // Brand field should not be shown for Opentrons tube rack (aka non-custom)
      cy.contains('Brand is a required field').should('not.exist')

      // File info
      cy.get(
        "input[placeholder='Opentrons 15 Tube Rack with Generic 0.01 mL']"
      ).should('exist')
      cy.get("input[placeholder='opentrons_15_tuberack_10ul']").should('exist')

      // All fields present
      cy.get('button[class*="_export_button_"]').click({ force: true })
      cy.contains(
        'Please resolve all invalid fields in order to export the labware definition'
      ).should('not.exist')
    })
  })

  describe('Twentyfour tubes', () => {
    before(() => {
      navigateToUrl('/#/create')
      cy.get('label')
        .contains('What type of labware are you creating?')
        .children()
        .first()
        .trigger('mousedown')
      cy.get('*[class^="_option_label"]').contains('Tubes + Tube Rack').click()

      cy.get('label')
        .contains('Which tube rack?')
        .children()
        .first()
        .trigger('mousedown')
      cy.get('*[class^="_option_label"]').contains('24 tubes').click()

      cy.contains('Start creating labware').click({ force: true })
    })

    it('create a tuberack with 24 tubes', () => {
      cy.contains('Add missing info to see labware preview').should('exist')

      // Verify regularity
      cy.get("input[name='homogeneousWells'][value='false']").check({
        force: true,
      })
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('exist')
      cy.get("input[name='homogeneousWells'][value='true']").check({
        force: true,
      })
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('not.exist')

      // Verify height
      cy.get("input[name='labwareZDimension']").type('150').blur()
      cy.contains('This labware may be too tall').should('exist')
      cy.get("input[name='labwareZDimension']").clear().type('200').blur()
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('exist')
      cy.get("input[name='labwareZDimension']").clear().type('75').blur()
      cy.contains('This labware may be too tall').should('not.exist')
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('not.exist')

      // Verify volume
      cy.get("input[name='wellVolume']").focus().blur()
      cy.contains('Volume is a required field').should('exist')
      cy.get("input[name='wellVolume']").type('10').blur()
      cy.contains('Volume is a required field').should('not.exist')

      // Verify well shape
      cy.get("input[name='wellShape'][value='circular']").check({
        force: true,
      })
      cy.get("input[name='wellDiameter']").should('exist')
      cy.get("input[name='wellXDimension']").should('not.exist')
      cy.get("input[name='wellYDimension']").should('not.exist')
      cy.get("input[name='wellDiameter']").focus().blur()
      cy.contains('Diameter is a required field').should('exist')
      cy.get("input[name='wellDiameter']").type('10').blur()
      cy.contains('Diameter is a required field').should('not.exist')

      // verify rectangular wells
      cy.get("input[name='wellShape'][value='rectangular']").check({
        force: true,
      })
      cy.get("input[name='wellDiameter']").should('not.exist')
      cy.get("input[name='wellXDimension']").should('exist')
      cy.get("input[name='wellYDimension']").should('exist')
      cy.get("input[name='wellXDimension']").focus().blur()
      cy.contains('Tube X is a required field').should('exist')
      cy.get("input[name='wellXDimension']").type('10').blur()
      cy.contains('Tube X is a required field').should('not.exist')
      cy.get("input[name='wellYDimension']").focus().blur()
      cy.contains('Tube Y is a required field').should('exist')
      cy.get("input[name='wellYDimension']").type('10').blur()
      cy.contains('Tube Y is a required field').should('not.exist')

      // verify well bottom shape and depth
      cy.get("input[name='wellBottomShape'][value='flat']").check({
        force: true,
      })
      cy.get(wellBottomImageLocator.flat).should('exist')
      cy.get(wellBottomImageLocator.round).should('not.exist')
      cy.get(wellBottomImageLocator.v).should('not.exist')
      cy.get("input[name='wellBottomShape'][value='u']").check({
        force: true,
      })
      cy.get(wellBottomImageLocator.flat).should('not.exist')
      cy.get(wellBottomImageLocator.round).should('exist')
      cy.get(wellBottomImageLocator.v).should('not.exist')
      cy.get("input[name='wellBottomShape'][value='v']").check({
        force: true,
      })
      cy.get(wellBottomImageLocator.flat).should('not.exist')
      cy.get(wellBottomImageLocator.round).should('not.exist')
      cy.get(wellBottomImageLocator.v).should('exist')
      cy.get("input[name='wellDepth']").focus().blur()
      cy.contains('Depth is a required field').should('exist')
      cy.get("input[name='wellDepth']").type('10').blur()
      cy.contains('Depth is a required field').should('not.exist')

      cy.contains('Add missing info to see labware preview').should('not.exist')

      // verify file export
      // Brand field should not be shown for Opentrons tube rack (aka non-custom)
      cy.contains('Brand is a required field').should('not.exist')

      // File info
      cy.get(
        "input[placeholder='Opentrons 24 Tube Rack with Generic 0.01 mL']"
      ).should('exist')
      cy.get("input[placeholder='opentrons_24_tuberack_10ul']").should('exist')

      // All fields present
      cy.get('button[class*="_export_button_"]').click({ force: true })
      cy.contains(
        'Please resolve all invalid fields in order to export the labware definition'
      ).should('not.exist')
    })
  })
})
