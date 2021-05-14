import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'

import * as Config from '../../../../redux/config'
import {
  getCalibrationForPipette,
  getTipLengthForPipetteAndTiprack,
} from '../../../../redux/calibration'
import { useCalibratePipetteOffset } from '../../../../organisms/CalibratePipetteOffset/useCalibratePipetteOffset'

import { PipetteInfo } from '../PipetteInfo'
import { mockAttachedPipette } from '../__fixtures__'
import { mockConnectedRobot } from '../../../../redux/discovery/__fixtures__'
import { mockPipetteOffsetCalibration1 } from '../../../../redux/calibration/pipette-offset/__fixtures__'
import { mockTipLengthCalibration1 } from '../../../../redux/calibration/tip-length/__fixtures__'
import { getCustomLabwareDefinitions } from '../../../../redux/custom-labware'
import { getRobotByName } from '../../../../redux/discovery'
import { getIsRunning } from '../../../../redux/robot/selectors'

jest.mock('../../../../redux/calibration')
jest.mock('../../../../redux/config')
jest.mock('../../../../redux/custom-labware')
jest.mock(
  '../../../../organisms/CalibratePipetteOffset/useCalibratePipetteOffset'
)
jest.mock('react-router-dom', () => ({ Link: () => <></> }))
jest.mock('../../../../redux/discovery')
jest.mock('../../../../redux/robot/selectors')

const mockGetCustomLabwareDefinitions = getCustomLabwareDefinitions as jest.MockedFunction<
  typeof getCustomLabwareDefinitions
>
const mockGetCalibrationForPipette = getCalibrationForPipette as jest.MockedFunction<
  typeof getCalibrationForPipette
>
const mockGetTipLengthForPipetteAndTiprack = getTipLengthForPipetteAndTiprack as jest.MockedFunction<
  typeof getTipLengthForPipetteAndTiprack
>
const mockUseCalibratePipetteOffset = useCalibratePipetteOffset as jest.MockedFunction<
  typeof useCalibratePipetteOffset
>
const mockGetHasCalibrationBlock = Config.getHasCalibrationBlock as jest.MockedFunction<
  typeof Config.getHasCalibrationBlock
>
const mockGetRobotByName = getRobotByName as jest.MockedFunction<
  typeof getRobotByName
>
const mockGetIsRunning = getIsRunning as jest.MockedFunction<
  typeof getIsRunning
>

describe('PipetteInfo', () => {
  const robotName = 'robot-name'
  let render: (
    props?: Partial<React.ComponentProps<typeof PipetteInfo>>
  ) => ReturnType<typeof mountWithStore>
  let startWizard: any

  beforeEach(() => {
    startWizard = jest.fn()
    mockUseCalibratePipetteOffset.mockReturnValue([startWizard, null])
    mockGetCalibrationForPipette.mockReturnValue(null)
    mockGetTipLengthForPipetteAndTiprack.mockReturnValue(null)
    mockGetCustomLabwareDefinitions.mockReturnValue([])
    mockGetHasCalibrationBlock.mockReturnValue(null)
    mockGetIsRunning.mockReturnValue(false)
    mockGetRobotByName.mockReturnValue(mockConnectedRobot)

    render = (props = {}) => {
      const { pipette = mockAttachedPipette } = props
      return mountWithStore(
        <PipetteInfo
          robotName={robotName}
          mount="left"
          pipette={pipette}
          changeUrl="change/pipette"
          settingsUrl="settings/pipette"
          isChangingOrConfiguringPipette={false}
        />
      )
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('hides recalibrate tip if no pipette offset cal data', () => {
    const { wrapper } = render()
    expect(wrapper.find('button[title="recalibrateTipButton"]').exists()).toBe(
      false
    )
  })

  it('just launch POC w/o cal block modal if POC button clicked and data exists', () => {
    mockGetCalibrationForPipette.mockReturnValue(mockPipetteOffsetCalibration1)
    const { wrapper } = render()
    wrapper.find('button[title="pipetteOffsetCalButton"]').invoke('onClick')?.(
      {} as React.MouseEvent
    )
    wrapper.update()
    expect(startWizard).toHaveBeenCalledWith({
      withIntent: 'recalibrate-pipette-offset',
    })
  })

  it('launch POC w/ cal block modal denied if POC button clicked and no existing data and no cal block pref saved', () => {
    const { wrapper } = render()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(false)
    wrapper.find('button[title="pipetteOffsetCalButton"]').invoke('onClick')?.(
      {} as React.MouseEvent
    )
    wrapper.update()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(true)
    wrapper
      .find('button[children="Continue with calibration block"]')
      .invoke('onClick')?.({} as React.MouseEvent)
    expect(startWizard).toHaveBeenCalledWith({
      overrideParams: {
        hasCalibrationBlock: true,
        shouldRecalibrateTipLength: false,
      },
      withIntent: 'recalibrate-pipette-offset',
    })
  })

  it('launch POC w/ cal block modal confirmed if POC button clicked and no existing data and no cal block pref saved', () => {
    const { wrapper } = render()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(false)
    wrapper.find('button[title="pipetteOffsetCalButton"]').invoke('onClick')?.(
      {} as React.MouseEvent
    )
    wrapper.update()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(true)
    wrapper.find('button[children="Use trash bin"]').invoke('onClick')?.(
      {} as React.MouseEvent
    )
    expect(startWizard).toHaveBeenCalledWith({
      overrideParams: {
        hasCalibrationBlock: false,
        shouldRecalibrateTipLength: false,
      },
      withIntent: 'recalibrate-pipette-offset',
    })
  })

  it('launch POWT w/ cal block modal denied if recal tip button clicked and no cal block pref saved', () => {
    mockGetCalibrationForPipette.mockReturnValue(mockPipetteOffsetCalibration1)
    mockGetTipLengthForPipetteAndTiprack.mockReturnValue(
      mockTipLengthCalibration1
    )
    const { wrapper } = render()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(false)
    wrapper.find('button[title="recalibrateTipButton"]').invoke('onClick')?.(
      {} as React.MouseEvent
    )
    wrapper.update()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(true)
    wrapper
      .find('button[children="Continue with calibration block"]')
      .invoke('onClick')?.({} as React.MouseEvent)
    expect(startWizard).toHaveBeenCalledWith({
      overrideParams: {
        hasCalibrationBlock: true,
        shouldRecalibrateTipLength: true,
      },
      withIntent: 'tip-length-no-protocol',
    })
  })

  it('launch POWT w/ cal block modal confirmed if recal tip button clicked and no cal block pref saved', () => {
    mockGetCalibrationForPipette.mockReturnValue(mockPipetteOffsetCalibration1)
    mockGetTipLengthForPipetteAndTiprack.mockReturnValue(
      mockTipLengthCalibration1
    )
    const { wrapper } = render()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(false)
    wrapper.find('button[title="recalibrateTipButton"]').invoke('onClick')?.(
      {} as React.MouseEvent
    )
    wrapper.update()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(true)
    wrapper.find('button[children="Use trash bin"]').invoke('onClick')?.(
      {} as React.MouseEvent
    )
    expect(startWizard).toHaveBeenCalledWith({
      overrideParams: {
        hasCalibrationBlock: false,
        shouldRecalibrateTipLength: true,
      },
      withIntent: 'tip-length-no-protocol',
    })
  })

  it('launch POWT w/o cal block modal if recal tip button clicked and cal block pref saved as true', () => {
    mockGetHasCalibrationBlock.mockReturnValue(true)

    mockGetCalibrationForPipette.mockReturnValue(mockPipetteOffsetCalibration1)
    mockGetTipLengthForPipetteAndTiprack.mockReturnValue(
      mockTipLengthCalibration1
    )
    const { wrapper } = render()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(false)
    wrapper.find('button[title="recalibrateTipButton"]').invoke('onClick')?.(
      {} as React.MouseEvent
    )
    wrapper.update()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(false)
    expect(startWizard).toHaveBeenCalledWith({
      overrideParams: {
        hasCalibrationBlock: true,
        shouldRecalibrateTipLength: true,
      },
      withIntent: 'tip-length-no-protocol',
    })
  })

  it('launch POWT w/o cal block modal if recal tip button clicked and cal block pref saved as false', () => {
    mockGetHasCalibrationBlock.mockReturnValue(false)

    mockGetCalibrationForPipette.mockReturnValue(mockPipetteOffsetCalibration1)
    mockGetTipLengthForPipetteAndTiprack.mockReturnValue(
      mockTipLengthCalibration1
    )
    const { wrapper } = render()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(false)
    wrapper.find('button[title="recalibrateTipButton"]').invoke('onClick')?.(
      {} as React.MouseEvent
    )
    wrapper.update()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(false)
    expect(startWizard).toHaveBeenCalledWith({
      overrideParams: {
        hasCalibrationBlock: false,
        shouldRecalibrateTipLength: true,
      },
      withIntent: 'tip-length-no-protocol',
    })
  })

  it('buttons are disabled if robot is running', () => {
    mockGetHasCalibrationBlock.mockReturnValue(true)

    mockGetCalibrationForPipette.mockReturnValue(mockPipetteOffsetCalibration1)
    mockGetTipLengthForPipetteAndTiprack.mockReturnValue(
      mockTipLengthCalibration1
    )
    mockGetIsRunning.mockReturnValue(true)
    const { wrapper } = render()
    expect(
      wrapper.find('button[title="recalibrateTipButton"]').props()?.disabled
    ).toEqual(expect.any(String))
    expect(
      wrapper.find('button[title="pipetteOffsetCalButton"]').props()?.disabled
    ).toEqual(expect.any(String))
    expect(
      wrapper.find('button[title="pipetteSettingsButton"]').props()?.disabled
    ).toEqual(expect.any(String))
    expect(
      wrapper.find('button[title="changePipetteButton"]').props()?.disabled
    ).toEqual(expect.any(String))
  })
})
