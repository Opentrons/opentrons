import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { useTrackEvent } from '../../../../redux/analytics'
import { SetupDeckCalibration } from '../SetupDeckCalibration'
import { SetupPipetteCalibration } from '../SetupPipetteCalibration'
import { SetupTipLengthCalibration } from '../SetupTipLengthCalibration'
import { SetupRobotCalibration } from '../SetupRobotCalibration'

jest.mock('../../../../redux/analytics')
jest.mock('../SetupDeckCalibration')
jest.mock('../SetupPipetteCalibration')
jest.mock('../SetupTipLengthCalibration')

const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
const mockSetupDeckCalibration = SetupDeckCalibration as jest.MockedFunction<
  typeof SetupDeckCalibration
>
const mockSetupPipetteCalibration = SetupPipetteCalibration as jest.MockedFunction<
  typeof SetupPipetteCalibration
>
const mockSetupTipLengthCalibration = SetupTipLengthCalibration as jest.MockedFunction<
  typeof SetupTipLengthCalibration
>

const ROBOT_NAME = 'otie'
const RUN_ID = '1'

describe('SetupRobotCalibration', () => {
  const mockExpandStep = jest.fn()
  const mockTrackEvent = jest.fn()

  const render = ({
    robotName = ROBOT_NAME,
    runId = RUN_ID,
    nextStep = 'module_setup_step',
    calibrationStatus = { complete: true },
    expandStep = mockExpandStep,
  }: Partial<React.ComponentProps<typeof SetupRobotCalibration>> = {}) => {
    return renderWithProviders(
      <SetupRobotCalibration
        {...{
          robotName,
          runId,
          nextStep,
          calibrationStatus,
          expandStep,
        }}
      />,
      { i18nInstance: i18n }
    )
  }

  beforeEach(() => {
    when(mockUseTrackEvent).calledWith().mockReturnValue(mockTrackEvent)
    when(mockSetupDeckCalibration).mockReturnValue(
      <div>Mock SetupDeckCalibration</div>
    )
    when(mockSetupPipetteCalibration).mockReturnValue(
      <div>Mock SetupPipetteCalibration</div>
    )
    when(mockSetupTipLengthCalibration).mockReturnValue(
      <div>Mock SetupTipLengthCalibration</div>
    )
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders deck, pipette, and tip length calibration components', () => {
    const { getByText } = render()[0]

    getByText('Mock SetupDeckCalibration')
    getByText('Mock SetupPipetteCalibration')
    getByText('Mock SetupTipLengthCalibration')
  })

  it('changes Proceed CTA copy based on next step', () => {
    const { getByRole } = render({ nextStep: 'labware_setup_step' })[0]

    getByRole('button', { name: 'Proceed to Labware Setup' })
  })

  it('calls the expandStep function and tracks the analytics event on click', () => {
    const { getByRole } = render()[0]

    fireEvent.click(getByRole('button', { name: 'Proceed to Module Setup' }))
    expect(mockExpandStep).toHaveBeenCalled()
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: 'proceed_to_module_setup_step',
      properties: {},
    })
  })

  it('does not call the expandStep function on click if calibration is not complete', () => {
    const { getByRole } = render({ calibrationStatus: { complete: false } })[0]

    fireEvent.click(getByRole('button', { name: 'Proceed to Module Setup' }))
    expect(mockExpandStep).not.toHaveBeenCalled()
  })
})
