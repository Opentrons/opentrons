import 'cypress-file-upload'
import JSZip from 'jszip'
import { expectDeepEqual } from '@opentrons/shared-data/js/cypressUtils'

const expectedExportFixture =
  '../fixtures/somerackbrand_24_tuberack_1500ul.json'

context('Tubes and Rack', () => {
  before(() => {
    cy.visit('/create')
    cy.viewport('macbook-15')
  })

  describe('Custom 6 x 4 tube rack', () => {
    it('should show analytics opt-in', () => {
      cy.contains('Share sessions with the Opentrons Product Team?')
      cy.contains('NO').click({ force: true })
    })

    it('should allow user to select custom tube rack', () => {
      // TODO(IL, 2021-05-15): give Dropdown component semantic selectors for E2E
      cy.get('label')
        .contains('What type of labware are you creating?')
        .children()
        .first()
        .trigger('mousedown')
      cy.get('*[class^="Dropdown__option_label"]')
        .contains('Tubes + Tube Rack')
        .click()

      // TODO(IL, 2021-05-15): give Dropdown component semantic selectors for E2E
      cy.get('label')
        .contains('Which tube rack?')
        .children()
        .first()
        .trigger('mousedown')
      cy.get('*[class^="Dropdown__option_label"]')
        .contains('Non-Opentrons tube rack')
        .click()

      cy.contains('start creating labware').click({ force: true })
    })

    it('does not have a preview image', () => {
      cy.contains('Add missing info to see labware preview').should('exist')
    })

    it('tests regularity', () => {
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
    })

    it('tests height', () => {
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
    })

    it('tests grid', () => {
      cy.get("input[name='gridRows']").type('6').blur()
      cy.get("input[name='gridColumns']").type('4').blur()

      cy.get("input[name='regularRowSpacing'][value='true']").check({
        force: true,
      })
      cy.get("input[name='regularColumnSpacing'][value='true']").check({
        force: true,
      })
    })

    it('tests volume', () => {
      cy.get("input[name='wellVolume']").focus().blur()
      cy.contains('Volume is a required field').should('exist')
      cy.get("input[name='wellVolume']").type('1500').blur()
      cy.contains('Volume is a required field').should('not.exist')
    })

    it('tests rectangular wells', () => {
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
    })

    it('tests circular wells', () => {
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
    })

    it('tests well bottom shape and depth', () => {
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
      cy.get("input[name='wellDepth']").focus().blur()
      cy.contains('Depth is a required field').should('exist')
      cy.get("input[name='wellDepth']").type('100').blur()
      cy.contains('Depth is a required field').should('not.exist')
    })

    it('tests offset', () => {
      cy.get("input[name='gridSpacingX']").type('18').blur()
      cy.get("input[name='gridSpacingY']").type('14').blur()
      cy.get("input[name='gridOffsetX']").type('15').blur()
      cy.get("input[name='gridOffsetY']").type('8').blur()
    })

    it('does has a preview image', () => {
      cy.contains('Add missing info to see labware preview').should('not.exist')
    })

    it('tests the file export', () => {
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
    })

    it('should export a file matching the fixture', () => {
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
          .should('equal', `somerackbrand_24_tuberack_1500ul.zip`)
      })
    })
  })
})
