import * as React from 'react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { mockDropTipWizardContainerProps } from '../__fixtures__'
import { DropTipWizardContent, DropTipWizardContainer } from '../DropTipWizard'
import { DropTipWizardHeader } from '../DropTipWizardHeader'
import { InProgressModal } from '../../../molecules/InProgressModal/InProgressModal'
import { ExitConfirmation } from '../ExitConfirmation'
import { SimpleWizardBody } from '../../../molecules/SimpleWizardBody'
import { BeforeBeginning } from '../BeforeBeginning'
import { ChooseLocation } from '../ChooseLocation'
import { JogToPosition } from '../JogToPosition'
import { Success } from '../Success'
import {
  BEFORE_BEGINNING,
  CHOOSE_BLOWOUT_LOCATION,
  CHOOSE_DROP_TIP_LOCATION,
  POSITION_AND_BLOWOUT,
  POSITION_AND_DROP_TIP,
  BLOWOUT_SUCCESS,
  DROP_TIP_SUCCESS,
} from '../constants'

vi.mock('../../../molecules/InProgressModal/InProgressModal')
vi.mock('../ExitConfirmation')
vi.mock('../../../molecules/SimpleWizardBody')
vi.mock('../BeforeBeginning')
vi.mock('../ChooseLocation')
vi.mock('../JogToPosition')
vi.mock('../Success')
vi.mock('../DropTipWizardHeader')

const renderDropTipWizardContainer = (
  props: React.ComponentProps<typeof DropTipWizardContainer>
) => {
  return renderWithProviders(<DropTipWizardContainer {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('DropTipWizardContainer', () => {
  let props: React.ComponentProps<typeof DropTipWizardContainer>

  beforeEach(() => {
    props = mockDropTipWizardContainerProps

    vi.mocked(DropTipWizardHeader).mockReturnValue(
      <div>MOCK WIZARD HEADER</div>
    )
  })

  it('renders the special-cased Fixit view if the issuedCommandsType is fixit without a header', () => {
    renderDropTipWizardContainer({ ...props, issuedCommandsType: 'fixit' })

    expect(screen.queryByText('MOCK WIZARD HEADER')).not.toBeInTheDocument()
  })

  it('renders the setup view by default with a header', () => {
    renderDropTipWizardContainer(props)

    screen.getByText('MOCK WIZARD HEADER')
  })
})

const renderDropTipWizardContent = (
  props: React.ComponentProps<typeof DropTipWizardContent>
) => {
  return renderWithProviders(<DropTipWizardContent {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('DropTipWizardContent', () => {
  let props: React.ComponentProps<typeof DropTipWizardContent>

  beforeEach(() => {
    props = mockDropTipWizardContainerProps

    vi.mocked(InProgressModal).mockReturnValue(
      <div>MOCK_IN_PROGRESS_MODAL</div>
    )
    vi.mocked(ExitConfirmation).mockReturnValue(
      <div>MOCK_EXIT_CONFIRMATION</div>
    )
    vi.mocked(SimpleWizardBody).mockReturnValue(<div>MOCK_ERROR_SCREEN</div>)
    vi.mocked(BeforeBeginning).mockReturnValue(<div>MOCK_BEFORE_BEGINNING</div>)
    vi.mocked(ChooseLocation).mockReturnValue(<div>MOCK_CHOOSE_LOCATION</div>)
    vi.mocked(JogToPosition).mockReturnValue(<div>MOCK_JOG_TO_POSITION</div>)
    vi.mocked(Success).mockReturnValue(<div>MOCK_SUCCESS</div>)
  })

  it(`renders InProgressModal when activeMaintenanceRunId is null`, () => {
    renderDropTipWizardContent({ ...props, activeMaintenanceRunId: null })

    screen.getByText('MOCK_IN_PROGRESS_MODAL')
  })

  it(`renders InProgressModal when isCommandInProgress is true`, () => {
    renderDropTipWizardContent({ ...props, isCommandInProgress: true })

    screen.getByText('MOCK_IN_PROGRESS_MODAL')
  })

  it(`renders InProgressModal when isExiting is true`, () => {
    renderDropTipWizardContent({ ...props, isExiting: true })

    screen.getByText('MOCK_IN_PROGRESS_MODAL')
  })

  it(`renders ExitConfirmation when showConfirmExit is true`, () => {
    renderDropTipWizardContent({ ...props, showConfirmExit: true })

    screen.getByText('MOCK_EXIT_CONFIRMATION')
  })

  it(`renders SimpleWizardBody when errorDetails is not null`, () => {
    renderDropTipWizardContent({
      ...props,
      errorDetails: { message: 'MOCK_MESSAGE' },
    })

    screen.getByText('MOCK_ERROR_SCREEN')
  })

  it(`renders BeforeBeginning when currentStep is ${BEFORE_BEGINNING}`, () => {
    renderDropTipWizardContent({ ...props, currentStep: BEFORE_BEGINNING })

    screen.getByText('MOCK_BEFORE_BEGINNING')
  })

  it(`renders ChooseLocation when currentStep is ${CHOOSE_BLOWOUT_LOCATION}`, () => {
    renderDropTipWizardContent({
      ...props,
      currentStep: CHOOSE_BLOWOUT_LOCATION,
    })

    screen.getByText('MOCK_CHOOSE_LOCATION')
  })

  it(`renders ChooseLocation when currentStep is ${CHOOSE_DROP_TIP_LOCATION}`, () => {
    renderDropTipWizardContent({
      ...props,
      currentStep: CHOOSE_DROP_TIP_LOCATION,
    })

    screen.getByText('MOCK_CHOOSE_LOCATION')
  })

  it(`renders JogToPosition when currentStep is ${POSITION_AND_BLOWOUT} `, () => {
    renderDropTipWizardContent({ ...props, currentStep: POSITION_AND_BLOWOUT })

    screen.getByText('MOCK_JOG_TO_POSITION')
  })

  it(`renders JogToPosition when currentStep is ${POSITION_AND_DROP_TIP}`, () => {
    renderDropTipWizardContent({ ...props, currentStep: POSITION_AND_DROP_TIP })

    screen.getByText('MOCK_JOG_TO_POSITION')
  })

  it(`renders Success when currentStep is ${BLOWOUT_SUCCESS}`, () => {
    renderDropTipWizardContent({ ...props, currentStep: BLOWOUT_SUCCESS })

    screen.getByText('MOCK_SUCCESS')
  })

  it(`renders Success when currentStep is ${DROP_TIP_SUCCESS}`, () => {
    renderDropTipWizardContent({ ...props, currentStep: DROP_TIP_SUCCESS })

    screen.getByText('MOCK_SUCCESS')
  })

  it('renders alternative success button copy when the commandType is fixit', () => {
    renderDropTipWizardContent({
      ...props,
      currentStep: DROP_TIP_SUCCESS,
      fixitCommandTypeUtils: {
        copyOverrides: { tipDropCompleteBtnCopy: 'proceed_to_tip_selection' },
      } as any,
    })

    expect(vi.mocked(Success)).toHaveBeenCalledWith(
      expect.objectContaining({
        proceedText: 'proceed_to_tip_selection',
      }),
      expect.anything()
    )
  })
})
