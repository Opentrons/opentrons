// @flow
import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'

import * as Config from '../../../config'
import {
  getCalibrationForPipette,
  getTipLengthForPipetteAndTiprack,
} from '../../../calibration'
import { useCalibratePipetteOffset } from '../../CalibratePipetteOffset/useCalibratePipetteOffset'

import type { State } from '../../../types'

import { PipetteInfo } from '../PipetteInfo'
import { mockAttachedPipette } from '../__fixtures__'
import { mockPipetteOffsetCalibration1 } from '../../../calibration/pipette-offset/__fixtures__'
import { mockTipLengthCalibration1 } from '../../../calibration/tip-length/__fixtures__'
import { getCustomLabwareDefinitions } from '../../../custom-labware'

jest.mock('../../../calibration')
jest.mock('../../../config')
jest.mock('../../../custom-labware')
jest.mock('../../CalibratePipetteOffset/useCalibratePipetteOffset')
jest.mock('react-router-dom', () => ({ Link: () => <></> }))

const mockGetCustomLabwareDefinitions: JestMockFn<
  [State],
  $Call<typeof getCustomLabwareDefinitions, State>
> = getCustomLabwareDefinitions

const mockGetCalibrationForPipette: JestMockFn<
  [State, string, string],
  $Call<typeof getCalibrationForPipette, State, string, string>
> = getCalibrationForPipette

const mockGetTipLengthForPipetteAndTiprack: JestMockFn<
  [State, string, string, string],
  $Call<typeof getTipLengthForPipetteAndTiprack, State, string, string, string>
> = getTipLengthForPipetteAndTiprack

const mockUseCalibratePipetteOffset: JestMockFn<
  [string, {}, null],
  $Call<typeof useCalibratePipetteOffset, string, {}, null>
> = useCalibratePipetteOffset

const mockGetHasCalibrationBlock: JestMockFn<
  [State],
  $Call<typeof Config.getHasCalibrationBlock, State>
> = Config.getHasCalibrationBlock

describe('PipetteInfo', () => {
  const robotName = 'robot-name'
  let render
  let startWizard

  beforeEach(() => {
    startWizard = jest.fn()
    mockUseCalibratePipetteOffset.mockReturnValue([startWizard, null])
    mockGetCalibrationForPipette.mockReturnValue(null)
    mockGetTipLengthForPipetteAndTiprack.mockReturnValue(null)
    mockGetCustomLabwareDefinitions.mockReturnValue([])
    mockGetHasCalibrationBlock.mockReturnValue(null)

    render = (props: $Shape<React.ElementProps<typeof PipetteInfo>> = {}) => {
      const { pipette = mockAttachedPipette } = props
      return mountWithStore(
        <PipetteInfo
          robotName={robotName}
          mount="left"
          pipette={pipette}
          changeUrl="change/pipette"
          settingsUrl="settings/pipette"
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
    wrapper.find('button[children="Calibrate offset"]').invoke('onClick')()
    wrapper.update()
    expect(startWizard).toHaveBeenCalledWith({ withIntent: 'pipette-offset' })
  })

  it('launch POC w/ cal block modal denied if POC button clicked and no existing data and no cal block pref saved', () => {
    const { wrapper } = render()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(false)
    wrapper.find('button[children="Calibrate offset"]').invoke('onClick')()
    wrapper.update()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(true)
    wrapper
      .find('button[children="Continue with calibration block"]')
      .invoke('onClick')()
    expect(startWizard).toHaveBeenCalledWith({
      overrideParams: {
        hasCalibrationBlock: true,
        shouldRecalibrateTipLength: false,
      },
      withIntent: 'pipette-offset',
    })
  })

  it('launch POC w/ cal block modal confirmed if POC button clicked and no existing data and no cal block pref saved', () => {
    const { wrapper } = render()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(false)
    wrapper.find('button[children="Calibrate offset"]').invoke('onClick')()
    wrapper.update()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(true)
    wrapper.find('button[children="Use trash bin"]').invoke('onClick')()
    expect(startWizard).toHaveBeenCalledWith({
      overrideParams: {
        hasCalibrationBlock: false,
        shouldRecalibrateTipLength: false,
      },
      withIntent: 'pipette-offset',
    })
  })

  it('no recalibrate tip button if POC and TLC data not present', () => {
    const { wrapper } = render()
    expect(wrapper.find('button[children="recalibrate tip"]').exists()).toBe(
      false
    )
  })

  it('launch POWT w/ cal block modal denied if recal tip button clicked and no cal block pref saved', () => {
    mockGetCalibrationForPipette.mockReturnValue(mockPipetteOffsetCalibration1)
    mockGetTipLengthForPipetteAndTiprack.mockReturnValue(
      mockTipLengthCalibration1
    )
    const { wrapper } = render()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(false)
    wrapper.find('button[children="recalibrate tip"]').invoke('onClick')()
    wrapper.update()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(true)
    wrapper
      .find('button[children="Continue with calibration block"]')
      .invoke('onClick')()
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
    wrapper.find('button[children="recalibrate tip"]').invoke('onClick')()
    wrapper.update()
    expect(wrapper.find('AskForCalibrationBlockModal').exists()).toBe(true)
    wrapper.find('button[children="Use trash bin"]').invoke('onClick')()
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
    wrapper.find('button[children="recalibrate tip"]').invoke('onClick')()
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
    wrapper.find('button[children="recalibrate tip"]').invoke('onClick')()
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
})
