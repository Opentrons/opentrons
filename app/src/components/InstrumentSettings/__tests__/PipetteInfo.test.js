// @flow
import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'

import * as Sessions from '../../../sessions'
import * as CustomLabware from '../../../custom-labware'
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

  it('launches pip cal offset alone with no cal block check if no pipette offset cal data', () => {
    const { wrapper } = render()
    wrapper.find('button[children="Calibrate offset"]').invoke('onClick')()
    wrapper.update()
    expect(startWizard).toHaveBeenCalledWith({})
  })

  // it('launches pip cal offset alone with no cal block check if no pipette offset cal data', () => {
  //   const { wrapper } = render()
  //   mockGetCalibrationForPipette.mockReturnValue(
  //     mockPipetteOffsetCalibration1.attributes
  //   )
  //   mockGetTipLengthForPipetteAndTiprack.mockReturnValue(
  //     mockTipLengthCalibration1.attributes
  //   )
  //   wrapper.find('button[title="pipetteOffsetCalButton"]').invoke('onClick')()
  //   wrapper.update()
  //   expect(startWizard).toHaveBeenCalledWith({})
  // })
})
