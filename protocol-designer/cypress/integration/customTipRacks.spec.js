import 'cypress-file-upload'

// Common Variables and Selectors
const protocolTitle = 'Custom Tip Rack Test Protocol'
const pipette = '[data-test="PipetteNameItem_p300SingleChannelGen2"]'
const customTipRackTitle = 'Custom 200µL Tiprack'
const customTipRackTitleWithotMicro = 'Custom 200uL Tiprack'
// Deck Map Slots
const slotOne = 'foreignObject[x="0"][y="0"]'
const slotTwo = 'foreignObject[x="132.5"][y="0"]'
const slotThree = 'foreignObject[x="265"][y="0"]'

describe('Custom Tip Racks', () => {
  beforeEach(() => {
    cy.viewport('macbook-15')
  })
  before(() => {
    cy.visit('/')
    cy.closeAnnouncementModal()
  })

  const testCases = [
    {
      title: 'Invalid File Type',
      uploadFile: '../fixtures/invalid_tip_rack.txt',
      expectedText: 'Incompatible file type',
    },
    {
      title: 'Invalid JSON File',
      uploadFile: '../fixtures/invalid_tip_rack.json',
      expectedText: 'Incompatible file type',
    },
    {
      title: 'Valid Labware that is not Tip Rack',
      uploadFile: '../fixtures/invalid_labware.json',
      expectedText: 'not a Tip Rack',
    },
    {
      title: 'Valid Tip Rack',
      uploadFile: '../fixtures/generic_96_tiprack_200ul.json',
      expectedText: null,
    },
    {
      title: 'Valid Tip Rack Again',
      uploadFile: '../fixtures/generic_96_tiprack_200ul.json',
      expectedText: 'Duplicate labware definition',
    },
  ]

  describe('build a new protocol with a custom tip rack', () => {
    it('sets up pipettes', () => {
      cy.get('button')
        .contains('Create New')
        .click()
      cy.get("input[placeholder='Untitled']").type(protocolTitle)
      cy.choosePipettes(pipette, pipette)
    })
    testCases.forEach(({ title, uploadFile, expectedText }) => {
      it('Uploads ' + title, () => {
        cy.fixture(uploadFile).then(fileContent => {
          cy.get('#main-page input[type=file]').upload({
            fileContent: JSON.stringify(fileContent),
            fileName: 'tip_rack.json',
            mimeType: 'application/json',
            encoding: 'utf8',
          })
        })
        if (expectedText) {
          // Verify expected text in error modals
          cy.contains(expectedText).should('exist')
          cy.get('button')
            .contains('OK')
            .click()
        } else {
          // Select custom tip racks on successful upload
          cy.selectTipRacks(customTipRackTitle, customTipRackTitle)
        }
      })
    })
    it('Verifies the tip rack on the deck', () => {
      cy.get('button')
        .contains('save', { matchCase: false })
        .click()
      cy.openDesignPage()
      cy.get('button')
        .contains('ok')
        .click()
      cy.contains(customTipRackTitleWithotMicro, { matchCase: false })
    })
    it('Duplicates the tip rack on the deck', () => {
      cy.get(slotOne).within(() => {
        cy.contains('Duplicate').click()
      })
      cy.get(slotTwo).within(() => {
        cy.contains(customTipRackTitleWithotMicro + ' (1)').should('exist')
      })
    })
    it('Adds tip rack with add labware button', () => {
      cy.get(slotThree).click()
      cy.get('h3')
        .contains('Custom Labware')
        .click()
      cy.get('#main-page-modal-portal-root').within(() => {
        cy.contains(customTipRackTitle).click()
      })
      cy.get(slotThree).within(() => {
        // TODO(SA 2020/04/14): Update test to expect increment of (2) when
        // bug #5632 is fixed
        cy.contains(customTipRackTitleWithotMicro).should('exist')
      })
    })
    it('Deletes the tip rack from the deck', () => {
      cy.get(slotThree).within(() => {
        cy.contains('Delete').click()
        cy.contains(customTipRackTitleWithotMicro).should('not.exist')
      })
    })
  })
})
