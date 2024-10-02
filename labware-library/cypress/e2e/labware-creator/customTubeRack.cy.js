import 'cypress-file-upload'

const expectedExportFixture =
  '../fixtures/somerackbrand_24_tuberack_1500ul.json'

const flat = 'img[alt*="flat bottom"]'
const round = 'img[alt*="u shaped"]'
const v = 'img[alt*="v shaped"]'

context('Tubes and Rack', () => {
  before(() => {
    cy.visit('/')
    cy.get('a[href="/create"]').first().click()
    cy.viewport('macbook-15')
  })

  describe('Custom 6 x 4 tube rack', () => {
    it('should create a custom tuberack', () => {
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
      cy.get('*[class^="_option_label"]')
        .contains('Non-Opentrons tube rack')
        .click()

      cy.contains('Start creating labware').click({ force: true })

      // no preview image yet
      cy.contains('Add missing info to see labware preview').should('exist')

      // regularity
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

      cy.get("input[name='footprintXDimension']").type('128').blur()
      cy.get("input[name='footprintYDimension']").clear().type('86').blur()

      // height
      cy.get("input[name='labwareZDimension']").type('150').blur()
      cy.contains('This labware may be too tall').should('exist')
      cy.get("input[name='labwareZDimension']").clear().type('200').blur()
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('exist')
      cy.get("input[name='labwareZDimension']").clear().type('120').blur()
      cy.contains('This labware may be too tall').should('not.exist')
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('not.exist')

      // grid
      cy.get("input[name='gridRows']").type('6').blur()
      cy.get("input[name='gridColumns']").type('4').blur()

      cy.get("input[name='regularRowSpacing'][value='true']").check({
        force: true,
      })
      cy.get("input[name='regularColumnSpacing'][value='true']").check({
        force: true,
      })

      // volume
      cy.get("input[name='wellVolume']").focus().blur()
      cy.contains('Volume is a required field').should('exist')
      cy.get("input[name='wellVolume']").type('1500').blur()
      cy.contains('Volume is a required field').should('not.exist')

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

      // circular wells
      cy.get("input[name='wellShape'][value='circular']").check({
        force: true,
      })
      cy.get("input[name='wellDiameter']").should('exist')
      cy.get("input[name='wellXDimension']").should('not.exist')
      cy.get("input[name='wellYDimension']").should('not.exist')
      cy.get("input[name='wellDiameter']").focus().blur()
      cy.contains('Diameter is a required field').should('exist')
      cy.get("input[name='wellDiameter']").type('12').blur()
      cy.contains('Diameter is a required field').should('not.exist')

      // well bottom shape and depth
      // check flat
      cy.get("input[name='wellBottomShape'][value='flat']").check({
        force: true,
      })
      cy.get(flat).should('exist')
      cy.get(round).should('not.exist')
      cy.get(v).should('not.exist')

      // check u shaped
      cy.get("input[name='wellBottomShape'][value='u']").check({
        force: true,
      })
      cy.get(flat).should('not.exist')
      cy.get(round).should('exist')
      cy.get(v).should('not.exist')

      // check v shaped
      cy.get("input[name='wellBottomShape'][value='v']").check({
        force: true,
      })
      cy.get(flat).should('not.exist')
      cy.get(round).should('not.exist')
      cy.get(v).should('exist')
      cy.get("input[name='wellDepth']").focus().blur()
      cy.contains('Depth is a required field').should('exist')
      cy.get("input[name='wellDepth']").type('100').blur()
      cy.contains('Depth is a required field').should('not.exist')

      // offset
      cy.get("input[name='gridSpacingX']").type('18').blur()
      cy.get("input[name='gridSpacingY']").type('14').blur()
      cy.get("input[name='gridOffsetX']").type('15').blur()
      cy.get("input[name='gridOffsetY']").type('8').blur()

      // verify preview image
      cy.contains('Add missing info to see labware preview').should('not.exist')

      // test file export
      // Try with missing fields
      cy.get('button[class*="_export_button_"]').click({ force: true })
      cy.contains(
        'Please resolve all invalid fields in order to export the labware definition'
      ).should('exist')
      cy.contains('close').click({ force: true })

      // Brand field should be shown for custom tube rack
      cy.contains('Brand is a required field').should('exist')

      cy.get("input[name='brand']").type('somerackbrand')
      cy.get("input[name='groupBrand']").type('sometubebrand')

      // File info
      cy.get(
        "input[placeholder='somerackbrand 24 Tube Rack with sometubebrand 1.5 mL']"
      ).should('exist')
      cy.get("input[placeholder='somerackbrand_24_tuberack_1500ul']").should(
        'exist'
      )

      // now try again with all fields set
      cy.fixture(expectedExportFixture).then(expectedExportLabwareDef => {
        const downloadsFolder = Cypress.config('downloadsFolder')
        cy.get('button').contains('EXPORT FILE').click()
        // this validates the filename and the contents of the file
        cy.readFile(
          `${downloadsFolder}/somerackbrand_24_tuberack_1500ul.json`
        ).then(actualExportLabwareDef => {
          expect(actualExportLabwareDef).to.deep.equal(expectedExportLabwareDef)
        })
      })
    })
  })
})
