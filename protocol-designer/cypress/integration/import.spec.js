describe('test import functionality', () => {
    beforeEach(() => {
        cy.visit('/')
        cy.closeAnnouncementModal()
    })

    it('should do something', () => {
        cy.get('[data-testid="file-button"]',{withinSubject:null}).should('exist');
    })
})
