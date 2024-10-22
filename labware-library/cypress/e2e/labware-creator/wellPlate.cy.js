// NOTE: This uses data that produces a labware definition file
// that cannot be imported. The creator probably shouldn't allow
// a user to do this.

import {
  navigateToUrl,
  fileHelper,
  wellBottomImageLocator,
} from '../../support/e2e'
const fileHolder = fileHelper('testpro_80_wellplate_100ul')

context('Well Plates', () => {
  before(() => {
    navigateToUrl('/#/create')
  })

  describe('Create a well plate', () => {
    before(() => {
      cy.get('label')
        .contains('What type of labware are you creating?')
        .children()
        .first()
        .trigger('mousedown')
      cy.get('*[class^="_option_label"]').contains('Well Plate').click()
      cy.get('button').contains('Start creating labware').click({ force: true })
    })
    it('creates a wellplate', () => {
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

      // Verify footprint
      cy.get("input[name='footprintXDimension']").type('150').blur()
      cy.contains(
        'Your labware is too large to fit in a single slot properly. Please fill out this form to request a custom labware definition.'
      ).should('exist')
      cy.get("input[name='footprintXDimension']").clear().type('127').blur()
      cy.contains(
        'Your labware is too large to fit in a single slot properly. Please fill out this form to request a custom labware definition.'
      ).should('not.exist')
      cy.get("input[name='footprintYDimension']").type('150').blur()
      cy.contains(
        'Your labware is too large to fit in a single slot properly. Please fill out this form to request a custom labware definition.'
      ).should('exist')
      cy.get("input[name='footprintYDimension']").clear().type('85').blur()
      cy.contains(
        'Your labware is too large to fit in a single slot properly. Please fill out this form to request a custom labware definition.'
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

      // Verify number of rows
      cy.get("input[name='gridRows']").focus().blur()
      cy.contains('Number of rows is a required field').should('exist')
      cy.get("input[name='gridRows']").type('8').blur()
      cy.contains('Number of rows is a required field').should('not.exist')

      // Verify rows are evenly spaced
      cy.get("input[name='regularRowSpacing'][value='false']").check({
        force: true,
      })
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('exist')
      cy.get("input[name='regularRowSpacing'][value='true']").check({
        force: true,
      })

      // Verify number of columns
      cy.get("input[name='gridColumns']").focus().blur()
      cy.contains('Number of columns is a required field').should('exist')
      cy.get("input[name='gridColumns']").type('10').blur()
      cy.contains('Number of columns is a required field').should('not.exist')

      // Verify columns are evenly spaced
      cy.get("input[name='regularColumnSpacing'][value='false']").check({
        force: true,
      })
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('exist')
      cy.get("input[name='regularColumnSpacing'][value='true']").check({
        force: true,
      })
      cy.contains(
        'Your labware is not compatible with the Labware Creator'
      ).should('not.exist')

      // Verify volume
      cy.get("input[name='wellVolume']").focus().blur()
      cy.contains('Volume is a required field').should('exist')
      cy.get("input[name='wellVolume']").type('100').blur()
      cy.contains('Volume is a required field').should('not.exist')

      // verify circular wells
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
      cy.contains('Well X is a required field').should('exist')
      cy.get("input[name='wellXDimension']").type('8').blur()
      cy.contains('Well X is a required field').should('not.exist')
      cy.get("input[name='wellYDimension']").focus().blur()
      cy.contains('Well Y is a required field').should('exist')
      cy.get("input[name='wellYDimension']").type('8').blur()
      cy.contains('Well Y is a required field').should('not.exist')

      // Verify well bottom shape and depth
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

      // Verify well spacing
      cy.get("input[name='gridSpacingX']").focus().blur()
      cy.contains('X Spacing (Xs) is a required field').should('exist')
      cy.get("input[name='gridSpacingX']").type('12').blur()
      cy.contains('X Spacing (Xs) is a required field').should('not.exist')
      cy.get("input[name='gridSpacingY']").focus().blur()
      cy.contains('Y Spacing (Ys) is a required field').should('exist')
      cy.get("input[name='gridSpacingY']").type('10').blur()
      cy.contains('Y Spacing (Ys) is a required field').should('not.exist')

      // Verify grid offset
      cy.get("input[name='gridOffsetX']").focus().blur()
      cy.contains('X Offset (Xo) is a required field').should('exist')
      cy.get("input[name='gridOffsetX']").type('10').blur()
      cy.contains('X Offset (Xo) is a required field').should('not.exist')
      cy.get("input[name='gridOffsetY']").focus().blur()
      cy.contains('Y Offset (Yo) is a required field').should('exist')
      cy.get("input[name='gridOffsetY']").type('8').blur()
      cy.contains('Y Offset (Yo) is a required field').should('not.exist')

      cy.contains('Add missing info to see labware preview').should('not.exist')
      cy.contains(
        'Please double-check well size, Y Spacing, and Y Offset.'
      ).should('not.exist')

      // Verify file export
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
      cy.get("input[placeholder='TestPro 80 Well Plate 100 µL']").should(
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
          cy.readFile(fileHolder.downloadPath).then(actualExportLabwareDef => {
            expect(actualExportLabwareDef).to.deep.equal(
              expectedExportLabwareDef
            )
          })
        }
      )
    })
  })
})
