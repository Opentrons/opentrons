import * as React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components/__utils__'
import { i18n } from '../../../../../i18n'
import * as PipetteOffset from '../../../../../redux/calibration/pipette-offset'
import * as TipLength from '../../../../../redux/calibration/tip-length'
import { mockProtocolPipetteTipRackCalInfo } from '../../../../../redux/pipettes/__fixtures__'
import * as Pipettes from '../../../../../redux/pipettes'
import { CONNECTABLE } from '../../../../../redux/discovery'
import { RobotCalibration } from '../index'
import type { ViewableRobot } from '../../../../../redux/discovery/types'
import type { ProtocolPipetteTipRackCalDataByMount } from '../../../../../redux/pipettes/types'

jest.mock('../../../../../redux/robot/selectors')
jest.mock('../../../../../redux/config/selectors')
jest.mock('../../../../../redux/pipettes/selectors')
jest.mock('../../../../../redux/calibration/selectors')
jest.mock('../../../../../redux/calibration/tip-length/selectors')
jest.mock('../../../../../redux/calibration/pipette-offset/selectors')
jest.mock('../../../../../redux/sessions/selectors')

const mockProtocolPipetteTipRackCalData: ProtocolPipetteTipRackCalDataByMount = {
  left: mockProtocolPipetteTipRackCalInfo,
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
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.resetAllMocks()
    jest.useRealTimers()
  })
  it('calls fetches data on mount and on a 10s interval', () => {
    const { store } = render()

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
    const { getByRole } = render()
    expect(getByRole('heading', { name: 'Required Pipettes' })).toBeTruthy()
    expect(
      getByRole('heading', { name: 'Required Tip Length Calibrations' })
    ).toBeTruthy()
    expect(
      getByRole('heading', {
        name: mockProtocolPipetteTipRackCalData.left?.pipetteDisplayName,
      })
    ).toBeTruthy()
    expect(
      getByRole('button', { name: 'Proceed to Module Setup' })
    ).toBeTruthy()
  })
  it('changes Proceed CTA copy based on next step', () => {
    const { getByRole } = render({ nextStep: 'labware_setup_step' })
    expect(
      getByRole('button', { name: 'Proceed to Labware Setup' })
    ).toBeTruthy()
  })
  it('calls the expandStep function on click', () => {
    const { getByRole } = render()
    fireEvent.click(getByRole('button', { name: 'Proceed to Module Setup' }))
    expect(mockExpandStep).toHaveBeenCalled()
  })
})
