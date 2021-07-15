// E2E Test Suite 01 for Opentrons App - Validate Robot Page
// NOTE: Not handling any calibration testing in this test suite. That will be handled in a different test suite.

// Ensures that the site is opened in the browser before each test case
describe('Test Suite 01 - Validate Robot Page', () => {
  before(() => {
    cy.visit('http://localhost:8090')
  })

  // Confirm that initial page has loaded properly and all initial content is present
  it('Successfully loads page', () => {
    // https://docs.cypress.io/guides/core-concepts/conditional-testing#Definition
    // need a deterministic check to know if this modal will appear
    // cy.dismissUpdateNotice()
    // Dismiss the update notice
    cy.get('button:contains("Not Now")').click()
    // ROBOT menu button
    cy.get('a[href="#/robots"]').should('exist').contains('Robot')
    // More menu button
    cy.get('a[href="#/more"]').should('exist').contains('More')
    // Robots header
    cy.get('h2:contains("Robots")').should('exist')
    // Inactive menu items exist
    cy.get('[aria-describedby="Tooltip__2"]')
      .should('exist')
      .contains('Protocol')
    cy.get('[aria-describedby="Tooltip__3"]')
      .should('exist')
      .contains('Calibrate')
    cy.get('[aria-describedby="Tooltip__4"]').should('exist').contains('Run')
  })

  // Checking to make sure that the application sees the robot
  it('Successfully sees robot', () => {
    cy.get('.Svg-sc-1lpozsw-0.styles__robot_item_icon__c1Zh1').should('exist')
    cy.get('.styles__robot_link__2AgJa').should('exist')
  })

  // Confirm successfully connected to the robot
  it('Successfully connected to robot', () => {
    cy.get('.buttons__button_flat__1YVfe > .Svg-sc-1lpozsw-0')
      .click()
      .then(() => {
        cy.get('[aria-describedby="Tooltip__1"]', { timeout: 30000 })
          .click()
          .then(() => {
            cy.get('.alerts__title__2SjPW').should(
              'have.text',
              'dev successfully connected'
            )
          })
      })
  })

  // Confirm Status box is present and robot is idle
  it('Confirm Status box is present and robot is idle', () => {
    cy.get(
      ':nth-child(1) > .Card__Section-r4iqug-0 > .Card__Title-r4iqug-1'
    ).should('have.text', 'status')
    cy.get('.bkjeCn').should('exist')
  })

  // Confirm able to disconnect and reconnect to the robot successfully
  it('Confirm able to disconnect and reconnect to robot', () => {
    // Disconnect from robot
    cy.get(
      ':nth-child(1) > .Card__Section-r4iqug-0 > .Flex-sc-1qhp8l7-0 > .Btn-o3dtr1-0'
    ).click({ force: true })

    // Reconnect to robot
    cy.get('.buttons__button_flat__1YVfe > .Svg-sc-1lpozsw-0')
      .click()
      .then(() => {
        cy.get('[aria-describedby="Tooltip__1"]', { timeout: 30000 })
          .click()
          .then(() => {
            cy.get('.alerts__title__2SjPW').should(
              'have.text',
              'dev successfully connected'
            )
          })
      })
  })

  // Validate that the information in the Information box is correct
  it('Confirm data in Information box is correct', () => {
    // Confirm robot name matches what is showing in the 'Robots' section
    cy.get(
      ':nth-child(1) > :nth-child(1) > .styles__robot_link__2AgJa > .styles__link_text__2dn0i'
    ).then($expectedRobotNameObj => {
      const expectedRobotName = $expectedRobotNameObj.text()
      cy.log('CONFIRM ROBOT NAME')
      cy.get('.kKVJSq > .iZeaJJ > .Box-sc-8ozbhb-0 > .hyTaau').should(
        'have.text',
        expectedRobotName
      )
    })

    // Confirm correct Server Version by comparing to version listed in App Software Settings
    cy.get('.cOCwJn > .iqXzje').click()
    cy.get('.structure__labeled_value_value__rgaIu').then(
      $expectedVersionObj => {
        const expectedVersion = $expectedVersionObj.text()
        cy.get('[aria-describedby="Tooltip__1"]').click()
        cy.log('CONFIRM APP VERSION')
        cy.get('.cSmEty > .iZeaJJ > .Box-sc-8ozbhb-0 > .hyTaau').should(
          'have.text',
          expectedVersion
        )
      }
    )

    // Confirm correct Firmware Version is 'edge'
    cy.log('CONFIRM FIRMWARE VERSION IS EDGE')
    cy.get('.kKVJSq > :nth-child(2) > .hyTaau').contains('edge')

    // Confirm Supported Protocol API Versions displays a min and max
    cy.log('CONFIRM SUPPORTED PROTOCOL API SHOWS MIN AND MAX')
    cy.get('.cSmEty > :nth-child(2) > .hyTaau').contains('min')
    cy.get('.cSmEty > :nth-child(2) > .hyTaau').contains('max')
  })

  // Validate that the Robot Calibration box is correct
  it('Confirm text in Robot Calibration is correct', () => {
    cy.get(
      ':nth-child(3) > .Card__Section-r4iqug-0 > :nth-child(2) > .Text-sc-1wb1h0f-0'
    ).should(
      'have.text',
      'Your OT-2 moves pipettes around in 3D space based on its calibration. Learn more about how calibration works on the OT-2.'
    )
    cy.get(':nth-child(3) > .Flex-sc-1qhp8l7-0 > .hClIVw > .jsVRdR').should(
      'have.text',
      'calibrate deck'
    )
    cy.get('.hClIVw > .isfRLh').should(
      'have.text',
      "Calibrate the position of the robot's deck. Recommended for all new robots and after moving robots."
    )
    cy.get(':nth-child(4) > .WMbIn > .hClIVw > .Text-sc-1wb1h0f-0').should(
      'have.text',
      'attached pipette calibrations'
    )
    cy.get(':nth-child(4) > .WMbIn > .hClIVw').should(
      'have.text',
      'attached pipette calibrationsCalibrate the position for the the default tip and pipette combination.'
    )
    cy.get(':nth-child(1) > .iLIkBZ > .dbpPbL > .jGjjkP > .jsVRdR').should(
      'have.text',
      'pipette offset calibration'
    )
    cy.get(':nth-child(1) > .iLIkBZ > .dbpPbL > .kPlLYJ > .jsVRdR').should(
      'have.text',
      'tip length calibration'
    )
    cy.get(':nth-child(2) > .iLIkBZ > .dbpPbL > .jGjjkP > .jsVRdR').should(
      'have.text',
      'pipette offset calibration'
    )
    cy.get(':nth-child(2) > .iLIkBZ > .dbpPbL > .kPlLYJ > .jsVRdR').should(
      'have.text',
      'tip length calibration'
    )
    cy.get(
      ':nth-child(5) > .Flex-sc-1qhp8l7-0 > .hClIVw > .Text-sc-1wb1h0f-0'
    ).should('have.text', 'calibration health check')
    cy.get(':nth-child(5) > .Flex-sc-1qhp8l7-0 > .hClIVw').should(
      'have.text',
      'calibration health checkCheck the health of the current calibration settings.'
    )
  })

  // Confirm able to download your calobration data and file exists
  it('Successfully able to download calibration data', () => {
    cy.get('.kNhjDP > .Link-sc-161jz7r-0').click({ force: true })
    cy.readFile(
      'cypress/downloads/opentrons-opentrons-dev-calibration.json'
    ).should('exist')
  })

  // Confirm Manage Pipettes button works and following screen is correct
  // NOTE: Not including calibration in this test case. That will be handled in a seperate test suite.
  it('Confirm Manage Pipettes button works and static information on page is correct', () => {
    cy.get(':nth-child(4) > .WMbIn > .dgnxPC > .Btn-o3dtr1-0').click({
      force: true,
    })
    cy.get('.Card__Title-r4iqug-1').should('have.text', 'Pipettes')

    // Validating left mount block
    cy.log('VALIDATION FOR LEFT MOUNT')
    cy.get(':nth-child(1) > .csWDnv').should('have.text', 'left mount')
    cy.get(
      ':nth-child(1) > .UPklf > .Flex-sc-1qhp8l7-0 > .Btn__PrimaryBtn-o3dtr1-1'
    ).should('exist')
    cy.get(
      ':nth-child(1) > .UPklf > .Flex-sc-1qhp8l7-0 > .Btn__SecondaryBtn-o3dtr1-2'
    ).should('exist')
    cy.get(':nth-child(1) > .lftXNf > .lhbjkl').should(
      'have.text',
      'Serial number:'
    )
    cy.get(':nth-child(1) > .heGIdG > .cbHQYJ').should(
      'have.text',
      'pipette offset calibration'
    )
    cy.get(':nth-child(1) > .heGIdG > .kAWKhO').should('exist')
    cy.get(':nth-child(1) > .heGIdG > .dLRwQQ').should(
      'have.text',
      'tip length calibration'
    )
    cy.get(':nth-child(1) > .heGIdG > .fghfQt').should('exist')
    cy.get(':nth-child(1) > .heGIdG > .iCKXQC').should('exist')
    cy.get(':nth-child(1) > .heGIdG > .ldhqLq').should(
      'have.text',
      'If you recalibrate this tip length, you will need to recalibrate your pipette offset afterwards'
    )

    // Validating right mount block
    cy.log('VALIDATION FOR RIGHT MOUNT')
    cy.get(':nth-child(2) > .csWDnv').should('have.text', 'right mount')
    cy.get(
      ':nth-child(2) > .UPklf > .Flex-sc-1qhp8l7-0 > .Btn__PrimaryBtn-o3dtr1-1'
    ).should('exist')
    cy.get(
      ':nth-child(2) > .UPklf > .Flex-sc-1qhp8l7-0 > .Btn__SecondaryBtn-o3dtr1-2'
    ).should('exist')
    cy.get(':nth-child(2) > .lftXNf > .lhbjkl').should(
      'have.text',
      'Serial number:'
    )
    cy.get(':nth-child(2) > .heGIdG > .cbHQYJ').should(
      'have.text',
      'pipette offset calibration'
    )
    cy.get(':nth-child(2) > .heGIdG > .kAWKhO').should('exist')
    cy.get(':nth-child(2) > .heGIdG > .dLRwQQ').should(
      'have.text',
      'tip length calibration'
    )
    cy.get(':nth-child(2) > .heGIdG > .fghfQt').should('exist')
    cy.get(':nth-child(2) > .heGIdG > .iCKXQC').should('exist')
    cy.get(':nth-child(2) > .heGIdG > .ldhqLq').should(
      'have.text',
      'If you recalibrate this tip length, you will need to recalibrate your pipette offset afterwards'
    )
  })

  // Confirm that the correct pipettes are appearing for the left and right mounts
  // Treating what appears on the Manage Pipettes screen as the correct value and comparing that to what appears in the Robot Calibration box for Left Mount and Right Mount
  it('Confirm correct pipettes appearing for left and right mounts', () => {
    // Return to pipettes page
    cy.get(':nth-child(2) > .styles__robot_link__2AgJa').click({ force: true })

    // Validate right mount pipette name
    cy.get(':nth-child(2) > .UPklf > .Text-sc-1wb1h0f-0').then(
      $expectedRightMountPipetteObj => {
        const expectedRightMountPipetteName = $expectedRightMountPipetteObj.text()
        cy.get(
          ':nth-child(1) > :nth-child(1) > .styles__robot_link__2AgJa'
        ).click({ force: true })
        cy.get(
          ':nth-child(2) > .iLIkBZ > .dbpPbL > .jGjjkP > .Flex-sc-1qhp8l7-0 > :nth-child(1)'
        ).then($actualRightMoutPipetteObj => {
          const actualRightMountPipetteName = $expectedRightMountPipetteObj.text()
          cy.expect(actualRightMountPipetteName).to.equal(
            expectedRightMountPipetteName
          )
        })
      }
    )

    // Return to pipettes page
    cy.get(':nth-child(2) > .styles__robot_link__2AgJa').click({ force: true })

    // Validate left mount pipette serial number
    cy.get(':nth-child(1) > .lftXNf > .isfRLh').then(
      $expectedLeftMountPipetteSerialNumberObj => {
        const expectedLeftMountPipetteSerialNumber = $expectedLeftMountPipetteSerialNumberObj.text()
        cy.get(
          ':nth-child(1) > :nth-child(1) > .styles__robot_link__2AgJa'
        ).click({ force: true })
        cy.get(
          ':nth-child(1) > .iLIkBZ > .dbpPbL > .jGjjkP > .Flex-sc-1qhp8l7-0 > :nth-child(2)'
        ).should('contain', expectedLeftMountPipetteSerialNumber)
      }
    )

    // Return to pipettes page
    cy.get(':nth-child(2) > .styles__robot_link__2AgJa').click({ force: true })

    // Validate right mount pipette serial number
    cy.get(':nth-child(2) > .lftXNf > .isfRLh').then(
      $expectedRightMountPipetteSerialNumberObj => {
        const expectedRightMountPipetteSerialNumber = $expectedRightMountPipetteSerialNumberObj.text()
        cy.get(
          ':nth-child(1) > :nth-child(1) > .styles__robot_link__2AgJa'
        ).click({ force: true })
        cy.get(
          ':nth-child(2) > .iLIkBZ > .dbpPbL > .jGjjkP > .Flex-sc-1qhp8l7-0 > :nth-child(2)'
        ).should('contain', expectedRightMountPipetteSerialNumber)
      }
    )

    // Return to pipettes page
    cy.get(':nth-child(2) > .styles__robot_link__2AgJa').click({ force: true })

    // Validate left mount tip length calibration
    cy.get(':nth-child(1) > .heGIdG > .fghfQt').then(
      $expectedLeftMountPipetteTipCalObj => {
        const expectedLeftMountPipetteTipCal = $expectedLeftMountPipetteTipCalObj.text()
        cy.get(
          ':nth-child(1) > :nth-child(1) > .styles__robot_link__2AgJa'
        ).click({ force: true })
        cy.get(
          ':nth-child(1) > .iLIkBZ > .dbpPbL > .kPlLYJ > .Flex-sc-1qhp8l7-0 > .isfRLh'
        ).should('have.text', expectedLeftMountPipetteTipCal)
      }
    )

    // Return to pipettes page
    cy.get(':nth-child(2) > .styles__robot_link__2AgJa').click({ force: true })

    // Validate right mount tip length calibration
    cy.get(':nth-child(2) > .heGIdG > .fghfQt').then(
      $expectedRightMountPipetteTipCalObj => {
        const expectedRightMountPipetteTipCal = $expectedRightMountPipetteTipCalObj.text()
        cy.get(
          ':nth-child(1) > :nth-child(1) > .styles__robot_link__2AgJa'
        ).click({ force: true })
        cy.get(
          ':nth-child(2) > .iLIkBZ > .dbpPbL > .kPlLYJ > .Flex-sc-1qhp8l7-0 > .isfRLh'
        ).should('have.text', expectedRightMountPipetteTipCal)
      }
    )
  })

  // Validate able to change Left Mount pipette
  it('Able to attempt to change Left Mount Pipette', () => {
    // Go to pipettes page
    cy.get(':nth-child(2) > .styles__robot_link__2AgJa').click({ force: true })

    cy.get(
      ':nth-child(1) > .UPklf > .Flex-sc-1qhp8l7-0 > .Btn__PrimaryBtn-o3dtr1-1'
    ).click({ force: true })
    // Validate content on modal
    cy.get('.styles__alert_list__2egAK > :nth-child(1)').should(
      'have.text',
      'All labware from the deck'
    )
    cy.get('.styles__alert_list__2egAK > :nth-child(2)').should(
      'have.text',
      'All tips from pipettes'
    )

    cy.get('.styles__alert_button__chIr0').click({ force: true })
    // Validate content on modal
    cy.get(
      '.structure__title_bar__1znKl > .buttons__button_flat__1YVfe'
    ).should('exist')
    cy.get(
      '.modals__modal_page__2wqi1 > .structure__title_bar__1znKl > .structure__title__3nJ-D'
    ).should('have.text', 'Pipette Setup')
    cy.get('.structure__subtitle__14qt0').should('have.text', 'left mount')
    cy.get('.modals__modal_heading__13Nz1').should('exist')
    cy.get(':nth-child(1) > .styles__step_legend__2T57E').should(
      'have.text',
      'Step one'
    )
    cy.get(':nth-child(2) > .styles__step_legend__2T57E').should(
      'have.text',
      'Step two'
    )
    cy.get('.styles__instructions__17vTV > :nth-child(1) > div').should(
      'have.text',
      'Loosen screws.'
    )
    cy.get('.styles__step_copy__m5ZRV').should(
      'have.text',
      'Hold on to pipette so it does not drop.'
    )
    cy.get(
      '.styles__instructions__17vTV > :nth-child(2) > :nth-child(2) > div > :nth-child(2)'
    ).should(
      'have.text',
      'Disconnect the pipette from robot by pulling the white connector tab.'
    )

    cy.get('.buttons__button_primary__5hLcQ').click({ force: true })
    // Validate content on modal
    cy.get('.buttons__button_primary__5hLcQ').should('exist')
    cy.get('.styles__confirm_failure_instructions__BzCVE').should(
      'have.text',
      'Check again to ensure that pipette is unplugged and entirely detached from robot.'
    )
    cy.get('.Box-sc-8ozbhb-0 > .buttons__button_primary__5hLcQ').should('exist')

    cy.get('.Box-sc-8ozbhb-0 > .Btn-o3dtr1-0').click({ force: true })
  })

  // Validate able to change Right Mount pipette
  it('Able to attempt to change Right Mount Pipette', () => {
    // Go to pipettes page
    cy.get(':nth-child(2) > .styles__robot_link__2AgJa').click({ force: true })

    cy.get(
      ':nth-child(2) > .UPklf > .Flex-sc-1qhp8l7-0 > .Btn__PrimaryBtn-o3dtr1-1'
    ).click({ force: true })
    // Validate content on modal
    cy.get('.styles__alert_list__2egAK > :nth-child(1)').should(
      'have.text',
      'All labware from the deck'
    )
    cy.get('.styles__alert_list__2egAK > :nth-child(2)').should(
      'have.text',
      'All tips from pipettes'
    )

    cy.get('.styles__alert_button__chIr0').click({ force: true })
    // Validate content on modal
    cy.get(
      '.structure__title_bar__1znKl > .buttons__button_flat__1YVfe'
    ).should('exist')
    cy.get(
      '.modals__modal_page__2wqi1 > .structure__title_bar__1znKl > .structure__title__3nJ-D'
    ).should('have.text', 'Pipette Setup')
    cy.get('.structure__subtitle__14qt0').should('have.text', 'right mount')
    cy.get('.modals__modal_heading__13Nz1').should('exist')
    cy.get(':nth-child(1) > .styles__step_legend__2T57E').should(
      'have.text',
      'Step one'
    )
    cy.get(':nth-child(2) > .styles__step_legend__2T57E').should(
      'have.text',
      'Step two'
    )
    cy.get('.styles__instructions__17vTV > :nth-child(1) > div').should(
      'have.text',
      'Loosen screws.'
    )
    cy.get('.styles__step_copy__m5ZRV').should(
      'have.text',
      'Hold on to pipette so it does not drop.'
    )
    cy.get(
      '.styles__instructions__17vTV > :nth-child(2) > :nth-child(2) > div > :nth-child(2)'
    ).should(
      'have.text',
      'Disconnect the pipette from robot by pulling the white connector tab.'
    )

    cy.get('.buttons__button_primary__5hLcQ').click({ force: true })
    // Validate content on modal
    cy.get('.buttons__button_primary__5hLcQ').should('exist')
    cy.get('.styles__confirm_failure_instructions__BzCVE').should(
      'have.text',
      'Check again to ensure that pipette is unplugged and entirely detached from robot.'
    )
    cy.get('.Box-sc-8ozbhb-0 > .buttons__button_primary__5hLcQ').should('exist')

    cy.get('.Box-sc-8ozbhb-0 > .Btn-o3dtr1-0').click({ force: true })
  })

  // Validate able to view pipette settings for left and right mount
  it('Successfully able to view pipette settings', () => {
    // Go to pipettes page
    cy.get(':nth-child(2) > .styles__robot_link__2AgJa').click({ force: true })

    // Go to Left Mount Pipette settings
    cy.get(
      ':nth-child(1) > .UPklf > .Flex-sc-1qhp8l7-0 > .Btn__SecondaryBtn-o3dtr1-2'
    ).click({ force: true })
    // Confirm correct text on page
    cy.get('.styles__warning_title__207LK').should('have.text', 'Warning:')
    cy.get('.styles__config_message__1lDFb > :nth-child(2)').should(
      'have.text',
      'These are advanced settings. Please do not attempt to adjust without assistance from an Opentrons support team member, as doing so may affect the lifespan of your pipette.'
    )
    cy.get('.styles__config_message__1lDFb > :nth-child(3)').should(
      'have.text',
      'Note that these settings will not override any pipette settings pre-defined in protocols.'
    )
    cy.get(
      ':nth-child(1) > :nth-child(1) > .forms__form_group_label__ms4Ya'
    ).should('have.text', 'Plunger Positions')
    cy.get(
      ':nth-child(2) > .styles__form_group__1iMs0 > .forms__form_group_label__ms4Ya'
    ).should('have.text', 'Tip Pickup / Drop')
    cy.get(
      ':nth-child(1) > :nth-child(1) > :nth-child(2) > .styles__form_label__2gtSs'
    ).should('have.text', 'Top')
    cy.get(
      ':nth-child(1) > :nth-child(1) > :nth-child(3) > .styles__form_label__2gtSs'
    ).should('have.text', 'Bottom')
    cy.get(
      ':nth-child(1) > :nth-child(1) > :nth-child(4) > .styles__form_label__2gtSs'
    ).should('have.text', 'Blowout')
    cy.get(
      ':nth-child(1) > :nth-child(1) > :nth-child(5) > .styles__form_label__2gtSs'
    ).should('have.text', 'Drop Tip')
    cy.get(
      ':nth-child(2) > .styles__form_group__1iMs0 > :nth-child(2) > .styles__form_label__2gtSs'
    ).should('have.text', 'Drop Tip Speed')
    cy.get(
      ':nth-child(2) > .styles__form_group__1iMs0 > :nth-child(3) > .styles__form_label__2gtSs'
    ).should('have.text', 'Pick Up Distance')
    cy.get(':nth-child(2) > .forms__form_group_label__ms4Ya').should('exist')
    cy.get('.styles__reset_message__2OuMP').should(
      'have.text',
      '* To reset an individual setting, simply clear the field.'
    )
    // Cancel settings modal
    cy.get('.styles__bottom_button_bar__1Uc4I > div > :nth-child(2)').click({
      force: true,
    })

    // Go to Right Mount Pipette settings
    cy.get(
      ':nth-child(2) > .UPklf > .Flex-sc-1qhp8l7-0 > .Btn__SecondaryBtn-o3dtr1-2'
    ).click({ force: true })
    // Confirm correct text on page
    cy.get('.styles__warning_title__207LK').should('have.text', 'Warning:')
    cy.get('.styles__config_message__1lDFb > :nth-child(2)').should(
      'have.text',
      'These are advanced settings. Please do not attempt to adjust without assistance from an Opentrons support team member, as doing so may affect the lifespan of your pipette.'
    )
    cy.get('.styles__config_message__1lDFb > :nth-child(3)').should(
      'have.text',
      'Note that these settings will not override any pipette settings pre-defined in protocols.'
    )
    cy.get(
      ':nth-child(1) > :nth-child(1) > .forms__form_group_label__ms4Ya'
    ).should('have.text', 'Plunger Positions')
    cy.get(
      ':nth-child(2) > .styles__form_group__1iMs0 > .forms__form_group_label__ms4Ya'
    ).should('have.text', 'Tip Pickup / Drop')
    cy.get(
      ':nth-child(1) > :nth-child(1) > :nth-child(2) > .styles__form_label__2gtSs'
    ).should('have.text', 'Top')
    cy.get(
      ':nth-child(1) > :nth-child(1) > :nth-child(3) > .styles__form_label__2gtSs'
    ).should('have.text', 'Bottom')
    cy.get(
      ':nth-child(1) > :nth-child(1) > :nth-child(4) > .styles__form_label__2gtSs'
    ).should('have.text', 'Blowout')
    cy.get(
      ':nth-child(1) > :nth-child(1) > :nth-child(5) > .styles__form_label__2gtSs'
    ).should('have.text', 'Drop Tip')
    cy.get(
      ':nth-child(2) > .styles__form_group__1iMs0 > :nth-child(2) > .styles__form_label__2gtSs'
    ).should('have.text', 'Drop Tip Speed')
    cy.get(
      ':nth-child(2) > .styles__form_group__1iMs0 > :nth-child(3) > .styles__form_label__2gtSs'
    ).should('have.text', 'Pick Up Distance')
    cy.get(':nth-child(2) > .forms__form_group_label__ms4Ya').should('exist')
    cy.get('.styles__reset_message__2OuMP').should(
      'have.text',
      '* To reset an individual setting, simply clear the field.'
    )
    // Cancel settings modal
    cy.get('.styles__bottom_button_bar__1Uc4I > div > :nth-child(2)').click({
      force: true,
    })
  })
})
