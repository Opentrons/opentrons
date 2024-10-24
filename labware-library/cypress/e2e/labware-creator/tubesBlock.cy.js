import {
  navigateToUrl,
  fileHelper,
  wellBottomImageLocator,
} from '../../support/e2e'
const fileHolder = fileHelper('testpro_24_aluminumblock_10ul')

context('Tubes and Block', () => {
  beforeEach(() => {
    navigateToUrl('/#/create')
    cy.get('label')
      .contains('What type of labware are you creating?')
      .children()
      .first()
      .trigger('mousedown')
    cy.get('*[class^="_option_label"]')
      .contains('Tubes / Plates + Opentrons Aluminum Block')
      .click()

    cy.get('label')
      .contains('Which aluminum block?')
      .children()
      .first()
      .trigger('mousedown')
    cy.get('*[class^="_option_label"]').contains('96 well').click()

    cy.get('label')
      .contains('What labware is on top of your aluminum block?')
      .children()
      .first()
      .trigger('mousedown')
    cy.get('*[class^="_option_label"]')
      .contains(/^Tubes$/)
      .click()

    cy.contains('Start creating labware').click({ force: true })
  })
  describe('96 Well', () => {
    describe('Tubes', () => {
      describe('Well shape tests', () => {
        it('tests circular wells', () => {
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
        })

        it('tests the whole form and file export', () => {
          cy.contains('Add missing info to see labware preview').should('exist')

          // verify regularity

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

          // verify height
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

          // verify volume

          cy.get("input[name='wellVolume']").focus().blur()
          cy.contains('Volume is a required field').should('exist')
          cy.get("input[name='wellVolume']").type('10').blur()
          cy.contains('Volume is a required field').should('not.exist')

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

          cy.contains('Add missing info to see labware preview').should(
            'not.exist'
          )

          // test file export
          // Try with missing fields
          cy.get('button[class*="_export_button_"]').click({ force: true })
          cy.contains(
            'Please resolve all invalid fields in order to export the labware definition'
          ).should('exist')
          cy.contains('close').click({ force: true })

          // Brand info
          cy.contains('Brand is a required field').should('exist')
          cy.get("input[name='brand']").type('TestPro')
          cy.contains('Brand is a required field').should('not.exist')
          cy.get("input[name='brandId']").type('001')

          // File info
          cy.get("input[placeholder='TestPro 96 Aluminum Block 10 µL']").should(
            'exist'
          )
          cy.get("input[placeholder='testpro_96_aluminumblock_10ul']").should(
            'exist'
          )

          // All fields present
          cy.get('button[class*="_export_button_"]').click({ force: true })
          cy.contains(
            'Please resolve all invalid fields in order to export the labware definition'
          ).should('not.exist')
        })
      })
    })

    describe('PCR Tube Strip', () => {
      it('does not have a preview image', () => {
        cy.contains('Add missing info to see labware preview').should('exist')
      })

      it('tests the whole form and file export', () => {
        // verify regularity
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
        // verify height
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

        // verify volume
        cy.get("input[name='wellVolume']").focus().blur()
        cy.contains('Volume is a required field').should('exist')
        cy.get("input[name='wellVolume']").type('10').blur()
        cy.contains('Volume is a required field').should('not.exist')

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

        // well shape

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
        cy.contains('Add missing info to see labware preview').should(
          'not.exist'
        )

        // file export
        // Try with missing fields
        cy.get('button[class*="_export_button_"]').click({ force: true })
        cy.contains(
          'Please resolve all invalid fields in order to export the labware definition'
        ).should('exist')
        cy.contains('close').click({ force: true })

        // Brand info
        cy.contains('Brand is a required field').should('exist')
        cy.get("input[name='brand']").type('TestPro')
        cy.contains('Brand is a required field').should('not.exist')
        cy.get("input[name='brandId']").type('001')

        // File info
        cy.get("input[placeholder='TestPro 96 Aluminum Block 10 µL']").should(
          'exist'
        )
        cy.get("input[placeholder='testpro_96_aluminumblock_10ul']").should(
          'exist'
        )

        // All fields present
        cy.get('button[class*="_export_button_"]').click({ force: true })
        cy.contains(
          'Please resolve all invalid fields in order to export the labware definition'
        ).should('not.exist')
      })
    })

    describe('PCR Plate', () => {
      beforeEach(() => {
        cy.get('label')
          .contains('What type of labware are you creating?')
          .children()
          .first()
          .trigger('mousedown')
        cy.get('*[class^="_option_label"]')
          .contains('Tubes / Plates + Opentrons Aluminum Block')
          .click()

        cy.get('label')
          .contains('Which aluminum block?')
          .children()
          .first()
          .trigger('mousedown')
        cy.get('*[class^="_option_label"]').contains('96 well').click()

        cy.get('label')
          .contains('What labware is on top of your aluminum block?')
          .children()
          .first()
          .trigger('mousedown')
        cy.get('*[class^="_option_label"]').contains('PCR Plate').click()

        cy.contains('Start creating labware').click({ force: true })
      })
      it('does not have a preview image', () => {
        cy.contains('Add missing info to see labware preview').should('exist')
      })

      it('tests the whole form and file export', () => {
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

        // height
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

        // volume
        cy.get("input[name='wellVolume']").focus().blur()
        cy.contains('Volume is a required field').should('exist')
        cy.get("input[name='wellVolume']").type('10').blur()
        cy.contains('Volume is a required field').should('not.exist')

        // circular well shape
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

        // rectangular well shape
        cy.get("input[name='wellShape'][value='rectangular']").check({
          force: true,
        })
        cy.get("input[name='wellDiameter']").should('not.exist')
        cy.get("input[name='wellXDimension']").should('exist')
        cy.get("input[name='wellYDimension']").should('exist')
        cy.get("input[name='wellXDimension']").focus().blur()
        cy.contains('Well X is a required field').should('exist')
        cy.get("input[name='wellXDimension']").type('10').blur()
        cy.contains('Well X is a required field').should('not.exist')
        cy.get("input[name='wellYDimension']").focus().blur()
        cy.contains('Well Y is a required field').should('exist')
        cy.get("input[name='wellYDimension']").type('10').blur()
        cy.contains('Well Y is a required field').should('not.exist')

        // well bottom

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

        cy.contains('Add missing info to see labware preview').should(
          'not.exist'
        )

        // file export
        // Try with missing fields
        cy.get('button[class*="_export_button_"]').click({ force: true })
        cy.contains(
          'Please resolve all invalid fields in order to export the labware definition'
        ).should('exist')
        cy.contains('close').click({ force: true })

        // Brand info
        cy.contains('Brand is a required field').should('exist')
        cy.get("input[name='brand']").type('TestPro')
        cy.contains('Brand is a required field').should('not.exist')
        cy.get("input[name='brandId']").type('001')

        // File info
        cy.get("input[placeholder='TestPro 96 Aluminum Block 10 µL']").should(
          'exist'
        )
        cy.get("input[placeholder='testpro_96_aluminumblock_10ul']").should(
          'exist'
        )

        // All fields present
        cy.get('button[class*="_export_button_"]').click({ force: true })
        cy.contains(
          'Please resolve all invalid fields in order to export the labware definition'
        ).should('not.exist')
      })
    })
  })

  describe('24 Well', () => {
    describe('Tubes', () => {
      it('does not have a preview image', () => {
        cy.contains('Add missing info to see labware preview').should('exist')
      })

      it('tests the whole form and file export', () => {
        navigateToUrl('/#/create')
        cy.get('label')
          .contains('What type of labware are you creating?')
          .children()
          .first()
          .trigger('mousedown')
        cy.get('*[class^="_option_label"]')
          .contains('Tubes / Plates + Opentrons Aluminum Block')
          .click()

        cy.get('label')
          .contains('Which aluminum block?')
          .children()
          .first()
          .trigger('mousedown')
        cy.get('*[class^="_option_label"]').contains('24 well').click()

        cy.get('label')
          .contains('What labware is on top of your aluminum block?')
          .should('not.exist')

        cy.contains('Start creating labware').click({ force: true })
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

        // height
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

        // volume

        cy.get("input[name='wellVolume']").focus().blur()
        cy.contains('Volume is a required field').should('exist')
        cy.get("input[name='wellVolume']").type('10').blur()
        cy.contains('Volume is a required field').should('not.exist')

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
        cy.contains('Well X is a required field').should('exist')
        cy.get("input[name='wellXDimension']").type('10').blur()
        cy.contains('Well X is a required field').should('not.exist')
        cy.get("input[name='wellYDimension']").focus().blur()
        cy.contains('Well Y is a required field').should('exist')
        cy.get("input[name='wellYDimension']").type('10').blur()
        cy.contains('Well Y is a required field').should('not.exist')

        // well bottom shape
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

        cy.contains('Add missing info to see labware preview').should(
          'not.exist'
        )

        // file export
        // Try with missing fields
        cy.get('button[class*="_export_button_"]').click({ force: true })
        cy.contains(
          'Please resolve all invalid fields in order to export the labware definition'
        ).should('exist')
        cy.contains('close').click({ force: true })

        // Brand info
        cy.contains('Brand is a required field').should('exist')
        cy.get("input[name='brand']").type('TestPro')
        cy.contains('Brand is a required field').should('not.exist')
        cy.get("input[name='brandId']").type('001')

        // File info
        cy.get("input[placeholder='TestPro 24 Aluminum Block 10 µL']").should(
          'exist'
        )
        cy.get(`input[placeholder='${fileHolder.downloadFileStem}']`).should(
          'exist'
        )

        // All fields present
        cy.get('button[class*="_export_button_"]').click({ force: true })
        cy.contains(
          'Please resolve all invalid fields in order to export the labware definition'
        ).should('not.exist')

        cy.fixture(fileHolder.expectedExportFixture).then(
          expectedExportLabwareDef => {
            cy.readFile(fileHolder.downloadPath).then(
              actualExportLabwareDef => {
                expect(actualExportLabwareDef).to.deep.equal(
                  expectedExportLabwareDef
                )
              }
            )
          }
        )
      })
    })
  })
})
