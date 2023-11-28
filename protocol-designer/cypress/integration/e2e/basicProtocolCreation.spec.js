import 'cypress-file-upload'

describe('test import functionality', () => {
    beforeEach(() => {
        cy.visit('/')
        cy.closeAnnouncementModal()
    })

    it('should create OT-2 protocol', () => {
        cy.openFilePage()
        cy.get('button').contains('Create New', { matchCase: false }).click()
        cy.get
    })
})
