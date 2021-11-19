import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { anyProps, renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/dom'
import { i18n } from '../../../../i18n'
import { LabwarePositionCheck } from '../index'
import { GenericStepScreen } from '../GenericStepScreen'
import { IntroScreen } from '../IntroScreen'
import { SummaryScreen } from '../SummaryScreen'
import { RobotMotionLoadingModal } from '../RobotMotionLoadingModal'
import { ConfirmPickUpTipModal } from '../ConfirmPickUpTipModal'
import { useSteps, useLabwarePositionCheck } from '../hooks'
import type { LabwarePositionCheckStep } from '../types'

jest.mock('../GenericStepScreen')
jest.mock('../IntroScreen')
jest.mock('../SummaryScreen')
jest.mock('../RobotMotionLoadingModal')
jest.mock('../ConfirmPickUpTipModal')
jest.mock('../hooks')

const mockGenericStepScreen = GenericStepScreen as jest.MockedFunction<
  typeof GenericStepScreen
>
const mockIntroScreen = IntroScreen as jest.MockedFunction<typeof IntroScreen>
const mockSummaryScreen = SummaryScreen as jest.MockedFunction<
  typeof SummaryScreen
>
const mockRobotMotionLoadingModal = RobotMotionLoadingModal as jest.MockedFunction<
  typeof RobotMotionLoadingModal
>
const mockConfirmPickUpTipModal = ConfirmPickUpTipModal as jest.MockedFunction<
  typeof ConfirmPickUpTipModal
>
const mockUseSteps = useSteps as jest.MockedFunction<typeof useSteps>

const mockUseLabwarePositionCheck = useLabwarePositionCheck as jest.MockedFunction<
  typeof useLabwarePositionCheck
>

const PICKUP_TIP_LABWARE_ID = 'PICKUP_TIP_LABWARE_ID'
const PRIMARY_PIPETTE_ID = 'PRIMARY_PIPETTE_ID'

const render = (props: React.ComponentProps<typeof LabwarePositionCheck>) => {
  return renderWithProviders(<LabwarePositionCheck {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LabwarePositionCheck', () => {
  let props: React.ComponentProps<typeof LabwarePositionCheck>
  beforeEach(() => {
    props = {
      onCloseClick: jest.fn(),
    }
    when(mockUseSteps)
      .calledWith()
      .mockReturnValue([
        {
          commands: [
            {
              commandType: 'pickUpTip',
              params: {
                pipetteId: PRIMARY_PIPETTE_ID,
                labwareId: PICKUP_TIP_LABWARE_ID,
              },
            },
          ],
          labwareId:
            '1d57fc10-67ad-11ea-9f8b-3b50068bd62d:opentrons/opentrons_96_filtertiprack_200ul/1',
          section: 'PRIMARY_PIPETTE_TIPRACKS',
        } as LabwarePositionCheckStep,
      ])

    when(mockUseLabwarePositionCheck)
      .calledWith(expect.anything(), expect.anything())
      .mockReturnValue({} as any)
    when(mockIntroScreen)
      .calledWith(anyProps())
      .mockReturnValue(<div>Mock Intro Screen</div>)
    when(mockGenericStepScreen)
      .calledWith(anyProps())
      .mockReturnValue(<div>Mock Generic Step Screen</div>)
    when(mockSummaryScreen)
      .calledWith(anyProps())
      .mockReturnValue(<div>Mock Summary Screen</div>)
    when(mockRobotMotionLoadingModal)
      .calledWith(anyProps())
      .mockReturnValue(<div>Mock Robot Motion Loading Modal</div>)
    when(mockConfirmPickUpTipModal)
      .calledWith(anyProps())
      .mockReturnValue(<div>Mock Confirm Pick Up Tip Modal</div>)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })
  it('renders LabwarePositionCheck header and button and no components', () => {
    const { getByRole } = render(props)
    getByRole('heading', {
      name: 'Labware Position Check',
    })
    getByRole('button', {
      name: 'exit',
    })
  })
  it('renders LabwarePositionCheck header and exit button is pressed', () => {
    const { getByRole } = render(props)
    expect(props.onCloseClick).not.toHaveBeenCalled()
    const exitButton = getByRole('button', {
      name: 'exit',
    })
    fireEvent.click(exitButton)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
  it('renders the loading screen', () => {
    mockUseLabwarePositionCheck.mockReturnValue({ isLoading: true } as any)
    const { getByText } = render(props)
    getByText('Mock Robot Motion Loading Modal')
  })
  it('renders the pick up tip confirmation modal', () => {
    mockUseLabwarePositionCheck.mockReturnValue({
      showPickUpTipConfirmationModal: true,
    } as any)
    const { getByText } = render(props)
    getByText('Mock Confirm Pick Up Tip Modal')
  })
  it('renders the summary screen', () => {
    mockUseLabwarePositionCheck.mockReturnValue({
      isComplete: true,
    } as any)
    const { getByText } = render(props)
    getByText('Mock Summary Screen')
  })
  it('renders the generic step screen', () => {
    mockUseLabwarePositionCheck.mockReturnValue({
      currentCommandIndex: 1,
    } as any)
    const { getByText } = render(props)
    getByText('Mock Generic Step Screen')
  })
  it('renders the into screen', () => {
    mockUseLabwarePositionCheck.mockReturnValue({
      currentCommandIndex: 0,
    } as any)
    const { getByText } = render(props)
    getByText('Mock Intro Screen')
  })
})
