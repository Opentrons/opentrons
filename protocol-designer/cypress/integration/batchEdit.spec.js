describe('Batch Edit Transfo', () => {
    beforeEach(() => {
        cy.visit('/')
        cy.closeAnnouncementModal()
    })

    //import the batchEdit.json to PD
    it('title', () => {
        cy.fixture('../../fixtures/protocol/4/batchEdit.json').then(fileContent => {
            cy.get('input[type=file]').upload({
                fileContent: JSON.stringify(fileContent),
                fileName: 'fixture.json',
                mimeType: 'application/json',
                encoding: 'utf8',
            })
            cy.get('[data-test="ComputingSpinner"]').should('exist')
            // wait until computation is done before proceeding, with generous timeout
            cy.get('[data-test="ComputingSpinner"]', { timeout: 30000 }).should(
                'not.exist'
            )
        })

        //Goto Design tab and verify the page

        cy.get("button[class*='navbar__tab__']")
            .contains('DESIGN')
            .parent()
            .click()
        cy.get('button').contains('ok').click()

        //Verify the Design Page
        // cy.contains('MULTI SELECT BANNER TEST PROTOCOL')
        // cy.contains('STARTING DECK STATE')
        // cy.contains('ADD STEP')


        //enter into the batch edit mode
        cy.get('[data-test="StepItem_1"]').click({
            shiftKey: true
        })



    })











})




















