// Scrolling seems wonky, so I disabled checking to see if
// an element is in view before clicking or checking with
// { force: true }

/* eslint-disable no-undef */
context('Tubes and Rack', function() {
  describe('Six tubes', () => {
    before(() => {
      cy.visit('/create')
      cy.viewport('macbook-15')
      cy.contains('NO').click({ force: true })
      cy.contains('Select...').click({ force: true })
      cy.contains('Tubes + Opentrons Tube Rack').click({ force: true })
      cy.contains('Select...').click({ force: true })
      cy.contains('6 tubes').click({ force: true })
      cy.contains('start creating labware').click({ force: true })
    })

    it('contains a button to the testing guide', function() {
      cy.contains('view test guide')
        .should('have.prop', 'href')
        .and('to.have.string', 'labwareDefinition_testGuide')
    })

    it('does not have a preview image', function() {
      cy.contains('Add missing info to see labware preview').should('exist')
    })

    it('tests regularity', function() {
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
    })

    it('tests height', function() {
      cy.get("input[name='labwareZDimension']")
        .type('150')
        .blur()
      cy.contains('This labware may be too tall').should('exist')
      cy.get("input[name='labwareZDimension']")
        .clear()
        .type('200')
        .blur()
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('exist')
      cy.get("input[name='labwareZDimension']")
        .clear()
        .type('75')
        .blur()
      cy.contains('This labware may be too tall').should('not.exist')
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('not.exist')
    })

    it('tests volume', function() {
      cy.get("input[name='wellVolume']")
        .focus()
        .blur()
      cy.contains('Max volume per well must be a number').should('exist')
      cy.get("input[name='wellVolume']")
        .type('10')
        .blur()
      cy.contains('Max volume per well must be a number').should('not.exist')
    })

    describe('Well shape tests', function() {
      it('tests circular wells', function() {
        cy.get("input[name='wellShape'][value='circular']").check({
          force: true,
        })
        cy.get("input[name='wellDiameter']").should('exist')
        cy.get("input[name='wellXDimension']").should('not.exist')
        cy.get("input[name='wellYDimension']").should('not.exist')
        cy.get("input[name='wellDiameter']")
          .focus()
          .blur()
        cy.contains('Diameter must be a number').should('exist')
        cy.get("input[name='wellDiameter']")
          .type('10')
          .blur()
        cy.contains('Diameter must be a number').should('not.exist')
      })

      it('tests rectangular wells', function() {
        cy.get("input[name='wellShape'][value='rectangular']").check({
          force: true,
        })
        cy.get("input[name='wellDiameter']").should('not.exist')
        cy.get("input[name='wellXDimension']").should('exist')
        cy.get("input[name='wellYDimension']").should('exist')
        cy.get("input[name='wellXDimension']")
          .focus()
          .blur()
        cy.contains('Well X must be a number').should('exist')
        cy.get("input[name='wellXDimension']")
          .type('10')
          .blur()
        cy.contains('Well X must be a number').should('not.exist')
        cy.get("input[name='wellYDimension']")
          .focus()
          .blur()
        cy.contains('Well Y must be a number').should('exist')
        cy.get("input[name='wellYDimension']")
          .type('10')
          .blur()
        cy.contains('Well Y must be a number').should('not.exist')
      })

      it('tests well bottom shape and depth', function() {
        cy.get("input[name='wellBottomShape'][value='flat']").check({
          force: true,
        })
        cy.get("img[src*='_flat.']").should('exist')
        cy.get("img[src*='_round.']").should('not.exist')
        cy.get("img[src*='_v.']").should('not.exist')
        cy.get("input[name='wellBottomShape'][value='u']").check({
          force: true,
        })
        cy.get("img[src*='_flat.']").should('not.exist')
        cy.get("img[src*='_round.']").should('exist')
        cy.get("img[src*='_v.']").should('not.exist')
        cy.get("input[name='wellBottomShape'][value='v']").check({
          force: true,
        })
        cy.get("img[src*='_flat.']").should('not.exist')
        cy.get("img[src*='_round.']").should('not.exist')
        cy.get("img[src*='_v.']").should('exist')
        cy.get("input[name='wellDepth']")
          .focus()
          .blur()
        cy.contains('Depth must be a number').should('exist')
        cy.get("input[name='wellDepth']")
          .type('10')
          .blur()
        cy.contains('Depth must be a number').should('not.exist')
      })

      it('does has a preview image', function() {
        cy.contains('Add missing info to see labware preview').should(
          'not.exist'
        )
      })

      it('tests the file export', function() {
        // Try with missing fields
        cy.get('button[class*="_export_button_"]').click({ force: true })
        cy.contains(
          'Please resolve all invalid fields in order to export the labware definition'
        ).should('exist')
        cy.contains('close').click({ force: true })

        // Brand info
        cy.contains('Brand is required').should('exist')
        cy.get("input[name='brand']").type('TestPro')
        cy.contains('Brand is required').should('not.exist')
        cy.get("input[name='brandId']").type('001')

        // File info
        cy.get("input[placeholder='TestPro 6 Tube Rack 10 µL']").should('exist')
        cy.get("input[placeholder='testpro_6_tuberack_10ul']").should('exist')

        // Test pipette
        cy.contains('Test Pipette is required').should('exist')
        cy.contains('Select...').click({ force: true })
        cy.contains('P10 Single').click({ force: true })
        cy.contains('Test Pipette is required').should('not.exist')

        // All fields present
        cy.get('button[class*="_export_button_"]').click({ force: true })
        cy.contains(
          'Please resolve all invalid fields in order to export the labware definition'
        ).should('not.exist')
      })
    })
  })

  describe('Fifteen tubes', () => {
    before(() => {
      cy.visit('/create')
      cy.viewport('macbook-15')
      cy.contains('NO').click({ force: true })
      cy.contains('Select...').click({ force: true })
      cy.contains('Tubes + Opentrons Tube Rack').click({ force: true })
      cy.contains('Select...').click({ force: true })
      cy.contains('15 tubes').click({ force: true })
      cy.contains('start creating labware').click({ force: true })
    })

    it('contains a button to the testing guide', function() {
      cy.contains('view test guide')
        .should('have.prop', 'href')
        .and('to.have.string', 'labwareDefinition_testGuide')
    })

    it('does not have a preview image', function() {
      cy.contains('Add missing info to see labware preview').should('exist')
    })

    it('tests regularity', function() {
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
    })

    it('tests height', function() {
      cy.get("input[name='labwareZDimension']")
        .type('150')
        .blur()
      cy.contains('This labware may be too tall').should('exist')
      cy.get("input[name='labwareZDimension']")
        .clear()
        .type('200')
        .blur()
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('exist')
      cy.get("input[name='labwareZDimension']")
        .clear()
        .type('75')
        .blur()
      cy.contains('This labware may be too tall').should('not.exist')
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('not.exist')
    })

    it('tests volume', function() {
      cy.get("input[name='wellVolume']")
        .focus()
        .blur()
      cy.contains('Max volume per well must be a number').should('exist')
      cy.get("input[name='wellVolume']")
        .type('10')
        .blur()
      cy.contains('Max volume per well must be a number').should('not.exist')
    })

    describe('Well shape tests', function() {
      it('tests circular wells', function() {
        cy.get("input[name='wellShape'][value='circular']").check({
          force: true,
        })
        cy.get("input[name='wellDiameter']").should('exist')
        cy.get("input[name='wellXDimension']").should('not.exist')
        cy.get("input[name='wellYDimension']").should('not.exist')
        cy.get("input[name='wellDiameter']")
          .focus()
          .blur()
        cy.contains('Diameter must be a number').should('exist')
        cy.get("input[name='wellDiameter']")
          .type('10')
          .blur()
        cy.contains('Diameter must be a number').should('not.exist')
      })

      it('tests rectangular wells', function() {
        cy.get("input[name='wellShape'][value='rectangular']").check({
          force: true,
        })
        cy.get("input[name='wellDiameter']").should('not.exist')
        cy.get("input[name='wellXDimension']").should('exist')
        cy.get("input[name='wellYDimension']").should('exist')
        cy.get("input[name='wellXDimension']")
          .focus()
          .blur()
        cy.contains('Well X must be a number').should('exist')
        cy.get("input[name='wellXDimension']")
          .type('10')
          .blur()
        cy.contains('Well X must be a number').should('not.exist')
        cy.get("input[name='wellYDimension']")
          .focus()
          .blur()
        cy.contains('Well Y must be a number').should('exist')
        cy.get("input[name='wellYDimension']")
          .type('10')
          .blur()
        cy.contains('Well Y must be a number').should('not.exist')
      })

      it('tests well bottom shape and depth', function() {
        cy.get("input[name='wellBottomShape'][value='flat']").check({
          force: true,
        })
        cy.get("img[src*='_flat.']").should('exist')
        cy.get("img[src*='_round.']").should('not.exist')
        cy.get("img[src*='_v.']").should('not.exist')
        cy.get("input[name='wellBottomShape'][value='u']").check({
          force: true,
        })
        cy.get("img[src*='_flat.']").should('not.exist')
        cy.get("img[src*='_round.']").should('exist')
        cy.get("img[src*='_v.']").should('not.exist')
        cy.get("input[name='wellBottomShape'][value='v']").check({
          force: true,
        })
        cy.get("img[src*='_flat.']").should('not.exist')
        cy.get("img[src*='_round.']").should('not.exist')
        cy.get("img[src*='_v.']").should('exist')
        cy.get("input[name='wellDepth']")
          .focus()
          .blur()
        cy.contains('Depth must be a number').should('exist')
        cy.get("input[name='wellDepth']")
          .type('10')
          .blur()
        cy.contains('Depth must be a number').should('not.exist')
      })

      it('does has a preview image', function() {
        cy.contains('Add missing info to see labware preview').should(
          'not.exist'
        )
      })

      it('tests the file export', function() {
        // Try with missing fields
        cy.get('button[class*="_export_button_"]').click({ force: true })
        cy.contains(
          'Please resolve all invalid fields in order to export the labware definition'
        ).should('exist')
        cy.contains('close').click({ force: true })

        // Brand info
        cy.contains('Brand is required').should('exist')
        cy.get("input[name='brand']").type('TestPro')
        cy.contains('Brand is required').should('not.exist')
        cy.get("input[name='brandId']").type('001')

        // File info
        cy.get("input[placeholder='TestPro 15 Tube Rack 10 µL']").should(
          'exist'
        )
        cy.get("input[placeholder='testpro_15_tuberack_10ul']").should('exist')

        // Test pipette
        cy.contains('Test Pipette is required').should('exist')
        cy.contains('Select...').click({ force: true })
        cy.contains('P10 Single').click({ force: true })
        cy.contains('Test Pipette is required').should('not.exist')

        // All fields present
        cy.get('button[class*="_export_button_"]').click({ force: true })
        cy.contains(
          'Please resolve all invalid fields in order to export the labware definition'
        ).should('not.exist')
      })
    })
  })

  describe('Twentyfour tubes', () => {
    before(() => {
      cy.visit('/create')
      cy.viewport('macbook-15')
      cy.contains('NO').click({ force: true })
      cy.contains('Select...').click({ force: true })
      cy.contains('Tubes + Opentrons Tube Rack').click({ force: true })
      cy.contains('Select...').click({ force: true })
      cy.contains('24 tubes (snap cap)').click({ force: true })
      cy.contains('start creating labware').click({ force: true })
    })

    it('contains a button to the testing guide', function() {
      cy.contains('view test guide')
        .should('have.prop', 'href')
        .and('to.have.string', 'labwareDefinition_testGuide')
    })

    it('does not have a preview image', function() {
      cy.contains('Add missing info to see labware preview').should('exist')
    })

    it('tests regularity', function() {
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
    })

    it('tests height', function() {
      cy.get("input[name='labwareZDimension']")
        .type('150')
        .blur()
      cy.contains('This labware may be too tall').should('exist')
      cy.get("input[name='labwareZDimension']")
        .clear()
        .type('200')
        .blur()
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('exist')
      cy.get("input[name='labwareZDimension']")
        .clear()
        .type('75')
        .blur()
      cy.contains('This labware may be too tall').should('not.exist')
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('not.exist')
    })

    it('tests volume', function() {
      cy.get("input[name='wellVolume']")
        .focus()
        .blur()
      cy.contains('Max volume per well must be a number').should('exist')
      cy.get("input[name='wellVolume']")
        .type('10')
        .blur()
      cy.contains('Max volume per well must be a number').should('not.exist')
    })

    describe('Well shape tests', function() {
      it('tests circular wells', function() {
        cy.get("input[name='wellShape'][value='circular']").check({
          force: true,
        })
        cy.get("input[name='wellDiameter']").should('exist')
        cy.get("input[name='wellXDimension']").should('not.exist')
        cy.get("input[name='wellYDimension']").should('not.exist')
        cy.get("input[name='wellDiameter']")
          .focus()
          .blur()
        cy.contains('Diameter must be a number').should('exist')
        cy.get("input[name='wellDiameter']")
          .type('10')
          .blur()
        cy.contains('Diameter must be a number').should('not.exist')
      })

      it('tests rectangular wells', function() {
        cy.get("input[name='wellShape'][value='rectangular']").check({
          force: true,
        })
        cy.get("input[name='wellDiameter']").should('not.exist')
        cy.get("input[name='wellXDimension']").should('exist')
        cy.get("input[name='wellYDimension']").should('exist')
        cy.get("input[name='wellXDimension']")
          .focus()
          .blur()
        cy.contains('Well X must be a number').should('exist')
        cy.get("input[name='wellXDimension']")
          .type('10')
          .blur()
        cy.contains('Well X must be a number').should('not.exist')
        cy.get("input[name='wellYDimension']")
          .focus()
          .blur()
        cy.contains('Well Y must be a number').should('exist')
        cy.get("input[name='wellYDimension']")
          .type('10')
          .blur()
        cy.contains('Well Y must be a number').should('not.exist')
      })

      it('tests well bottom shape and depth', function() {
        cy.get("input[name='wellBottomShape'][value='flat']").check({
          force: true,
        })
        cy.get("img[src*='_flat.']").should('exist')
        cy.get("img[src*='_round.']").should('not.exist')
        cy.get("img[src*='_v.']").should('not.exist')
        cy.get("input[name='wellBottomShape'][value='u']").check({
          force: true,
        })
        cy.get("img[src*='_flat.']").should('not.exist')
        cy.get("img[src*='_round.']").should('exist')
        cy.get("img[src*='_v.']").should('not.exist')
        cy.get("input[name='wellBottomShape'][value='v']").check({
          force: true,
        })
        cy.get("img[src*='_flat.']").should('not.exist')
        cy.get("img[src*='_round.']").should('not.exist')
        cy.get("img[src*='_v.']").should('exist')
        cy.get("input[name='wellDepth']")
          .focus()
          .blur()
        cy.contains('Depth must be a number').should('exist')
        cy.get("input[name='wellDepth']")
          .type('10')
          .blur()
        cy.contains('Depth must be a number').should('not.exist')
      })

      it('does has a preview image', function() {
        cy.contains('Add missing info to see labware preview').should(
          'not.exist'
        )
      })

      it('tests the file export', function() {
        // Try with missing fields
        cy.get('button[class*="_export_button_"]').click({ force: true })
        cy.contains(
          'Please resolve all invalid fields in order to export the labware definition'
        ).should('exist')
        cy.contains('close').click({ force: true })

        // Brand info
        cy.contains('Brand is required').should('exist')
        cy.get("input[name='brand']").type('TestPro')
        cy.contains('Brand is required').should('not.exist')
        cy.get("input[name='brandId']").type('001')

        // File info
        cy.get("input[placeholder='TestPro 24 Tube Rack 10 µL']").should(
          'exist'
        )
        cy.get("input[placeholder='testpro_24_tuberack_10ul']").should('exist')

        // Test pipette
        cy.contains('Test Pipette is required').should('exist')
        cy.contains('Select...').click({ force: true })
        cy.contains('P10 Single').click({ force: true })
        cy.contains('Test Pipette is required').should('not.exist')

        // All fields present
        cy.get('button[class*="_export_button_"]').click({ force: true })
        cy.contains(
          'Please resolve all invalid fields in order to export the labware definition'
        ).should('not.exist')
      })
    })
  })
})
