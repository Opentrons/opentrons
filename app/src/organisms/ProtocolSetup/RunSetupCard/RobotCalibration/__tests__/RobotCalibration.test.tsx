import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { useTrackEvent } from '../../../../../redux/analytics'
import * as PipetteOffset from '../../../../../redux/calibration/pipette-offset'
import * as TipLength from '../../../../../redux/calibration/tip-length'
import { mockPipetteInfo } from '../../../../../redux/pipettes/__fixtures__'
import * as Pipettes from '../../../../../redux/pipettes'
import { CONNECTABLE } from '../../../../../redux/discovery'
import { RobotCalibration } from '../index'
import type { ViewableRobot } from '../../../../../redux/discovery/types'
import type { ProtocolPipetteTipRackCalDataByMount } from '../../../../../redux/pipettes/types'

jest.mock('../../../../../redux/robot/selectors')
jest.mock('../../../../../redux/config/selectors')
jest.mock('../../../../../redux/pipettes/selectors')
jest.mock('../../../../../redux/calibration/selectors')
jest.mock('../../../../../redux/analytics')
jest.mock('../../../../../redux/calibration/tip-length/selectors')
jest.mock('../../../../../redux/calibration/pipette-offset/selectors')
jest.mock('../../../../../redux/sessions/selectors')
jest.mock('../../../../../redux/protocol')

const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>

const mockProtocolPipetteTipRackCalData: ProtocolPipetteTipRackCalDataByMount = {
  left: mockPipetteInfo,
  right: null,
} as any
const mockRobot: ViewableRobot = {
  name: 'robot-name',
  connected: true,
  status: CONNECTABLE,
} as any

const getProtocolPipetteTipRackCalInfo = Pipettes.getProtocolPipetteTipRackCalInfo as jest.MockedFunction<
  typeof Pipettes.getProtocolPipetteTipRackCalInfo
>

describe('RobotCalibration', () => {
  const mockExpandStep = jest.fn()
  const mockTrackEvent = jest.fn()
  const render = ({
    robot = mockRobot,
    nextStep = 'module_setup_step',
    calibrationStatus = { complete: true },
    expandStep = mockExpandStep,
  }: Partial<React.ComponentProps<typeof RobotCalibration>> = {}) => {
    return renderWithProviders(
      <RobotCalibration
        {...{
          robot,
          nextStep,
          calibrationStatus,
          expandStep,
        }}
      />,
      { i18nInstance: i18n }
    )
  }
  beforeEach(() => {
    jest.useFakeTimers()
    getProtocolPipetteTipRackCalInfo.mockReturnValue(
      mockProtocolPipetteTipRackCalData
    )
    when(mockUseTrackEvent).calledWith().mockReturnValue(mockTrackEvent)
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.resetAllMocks()
    jest.useRealTimers()
    resetAllWhenMocks()
  })
  it('calls fetches data on mount and on a 10s interval', () => {
    const store = render()[1]

    expect(store.dispatch).toHaveBeenNthCalledWith(
      1,
      Pipettes.fetchPipettes(mockRobot.name)
    )
    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      PipetteOffset.fetchPipetteOffsetCalibrations(mockRobot.name)
    )
    expect(store.dispatch).toHaveBeenNthCalledWith(
      3,
      TipLength.fetchTipLengthCalibrations(mockRobot.name)
    )
    jest.advanceTimersByTime(20000)
    expect(store.dispatch).toHaveBeenCalledTimes(3)
  })

  it('renders all text titles and button', () => {
    const { getByRole, getAllByRole } = render()[0]
    expect(getByRole('heading', { name: 'Required Pipettes' })).toBeTruthy()
    expect(
      getByRole('heading', { name: 'Required Tip Length Calibrations' })
    ).toBeTruthy()
    expect(
      getAllByRole('heading', {
        name: mockProtocolPipetteTipRackCalData.left?.pipetteDisplayName,
      })
    ).toBeTruthy()
    expect(
      getByRole('button', { name: 'Proceed to Module Setup' })
    ).toBeTruthy()
  })
  it('changes Proceed CTA copy based on next step', () => {
    const { getByRole } = render({ nextStep: 'labware_setup_step' })[0]
    expect(
      getByRole('button', { name: 'Proceed to Labware Setup' })
    ).toBeTruthy()
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
  it('does not the expandStep function on click if button is disabled', () => {
    const { getByRole } = render({ calibrationStatus: { complete: false } })[0]
    fireEvent.click(getByRole('button', { name: 'Proceed to Module Setup' }))
    expect(mockExpandStep).not.toHaveBeenCalled()
  })
})
