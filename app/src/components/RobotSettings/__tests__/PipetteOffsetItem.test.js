// @flow

import * as React from 'react'
import * as Enzyme from 'enzyme'
import type {
  PipetteModelSpecs,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { PipetteOffsetItem } from '../PipetteOffsetItem'
import { InlineCalibrationWarning } from '../../InlineCalibrationWarning'

import { findLabwareDefWithCustom } from '../../../findLabware'

jest.mock('../../../findLabware')

jest.mock('@opentrons/shared-data', () => ({
  getAllPipetteNames: jest.fn(
    jest.requireActual('@opentrons/shared-data').getAllPipetteNames
  ),
  getPipetteNameSpecs: jest.fn(
    jest.requireActual('@opentrons/shared-data').getPipetteNameSpecs
  ),
  getLabwareDisplayName: jest.fn(),
}))

const mockFindLabwareDefWithCustom: JestMockFn<
  [string | null, string | null, string | null, Array<LabwareDefinition2>],
  LabwareDefinition2 | null
> = findLabwareDefWithCustom

const mockGetLabwareDisplayName: JestMockFn<
  [LabwareDefinition2],
  string
> = getLabwareDisplayName

const getMountLabel = wrapper => wrapper.find('h4')

const getPipetteName = wrapper => wrapper.find('p').at(0)
const getNotCalibrated = wrapper => wrapper.find('p').at(1)
const getCalibrationText = wrapper => wrapper.find('p')
const getCalibrationTime = wrapper => wrapper.find('p').at(1)
const getCalibrationTiprack = wrapper => wrapper.find('p').at(2)
const getCalibrationWarning = wrapper => wrapper.find(InlineCalibrationWarning)

describe('PipetteOffsetItem', () => {
  let render
  beforeEach(() => {
    render = (props = {}) => {
      const {
        mount = 'left',
        pipette = {
          id: 'pipette-id-11',
          name: 'p300_single_gen2',
          model: 'p300_single_v2.0',
          tip_length: 0,
          mount_axis: 'z',
          plunger_axis: 'b',
          modelSpecs: ({
            displayName: 'P300 Single GEN2',
          }: $Shape<PipetteModelSpecs>),
        },
        calibration = {
          offset: {
            pipette: 'pipette-id-11',
            mount: 'left',
            offset: [1, 2, 3],
            tiprack: 'asdagasdfasdsa',
            tiprackUri: 'opentrons/opentrons_96_tiprack_300ul/1',
            lastModified: '2020-09-10T05:13Z',
            source: 'user',
            status: {
              markedBad: false,
              source: 'unknown',
              markedAt: '',
            },
            id: 'a_pip_id',
          },
          tipLength: {
            id: '1',
            tipLength: 30,
            tiprack: 'asdagasdfasdsa',
            pipette: 'pipette-id-11',
            lastModified: '2020-09-10T05:10Z',
            source: 'user',
            status: {
              markedBad: false,
              source: 'unknown',
              markedAt: '',
            },
          },
        },
        customLabware = [],
      } = props
      return Enzyme.mount(
        <PipetteOffsetItem
          mount={mount}
          pipette={pipette}
          calibration={calibration}
          customLabware={customLabware}
        />
      )
    }
  })

  it('shows null when no pipette present', () => {
    const wrapper = render({ pipette: null })
    expect(getMountLabel(wrapper).text()).toEqual('left')
    expect(getCalibrationText(wrapper).text()).toEqual('n/a')
    expect(getCalibrationWarning(wrapper).exists()).toBe(false)
  })

  it('says when you havent calibrated', () => {
    const wrapper = render({ calibration: null })
    expect(getMountLabel(wrapper).text()).toEqual('left')
    expect(getPipetteName(wrapper).text()).toEqual('P300 Single GEN2')
    expect(getNotCalibrated(wrapper).text()).toMatch(/haven't calibrated/)
    expect(getCalibrationText(wrapper)).toHaveLength(2)
    expect(getCalibrationWarning(wrapper).exists()).toBe(false)
  })

  it('displays date and tiprack display name from def', () => {
    mockFindLabwareDefWithCustom.mockReturnValue(
      ({ parameters: { loadName: 'opentrons_96_tiprack_300ul' } }: any)
    )
    mockGetLabwareDisplayName.mockReturnValue('Opentrons 96 Tiprack 300 fancy')

    const wrapper = render()
    expect(mockFindLabwareDefWithCustom).toHaveBeenCalledWith(
      'opentrons',
      'opentrons_96_tiprack_300ul',
      null,
      []
    )
    expect(mockGetLabwareDisplayName).toHaveBeenCalledWith({
      parameters: { loadName: 'opentrons_96_tiprack_300ul' },
    })
    expect(getMountLabel(wrapper).text()).toEqual('left')
    expect(getPipetteName(wrapper).text()).toEqual('P300 Single GEN2')
    expect(getCalibrationTime(wrapper).text()).toMatch(/September 10/)
    expect(getCalibrationTiprack(wrapper).text()).toMatch(
      /Opentrons 96 Tiprack 300/
    )
    expect(getCalibrationWarning(wrapper).exists()).toBe(false)
  })

  it('displays a warning when its offset calibration is marked bad', () => {
    mockFindLabwareDefWithCustom.mockReturnValue(
      ({ parameters: { loadName: 'opentrons_96_tiprack_300ul' } }: any)
    )
    mockGetLabwareDisplayName.mockReturnValue('Opentrons 96 Tiprack 300 fancy')

    const wrapper = render({
      calibration: {
        offset: {
          pipette: 'pipette-id-11',
          mount: 'left',
          offset: [1, 2, 3],
          tiprack: 'asdagasdfasdsa',
          tiprackUri: 'opentrons/opentrons_96_tiprack_300ul/1',
          lastModified: '2020-09-10T05:13',
          source: 'user',
          status: {
            markedBad: true,
            source: 'calibration_check',
            markedAt: '2020-10-09T13:30:00Z',
          },
          id: 'a_pip_id',
        },
        tipLength: {
          id: '1',
          tipLength: 30,
          tiprack: 'asdagasdfasdsa',
          pipette: 'pipette-id-11',
          lastModified: '2020-09-10T05:10Z',
          source: 'user',
          status: {
            markedBad: false,
            source: 'unknown',
            markedAt: '',
          },
        },
      },
    })
    expect(getCalibrationWarning(wrapper).exists()).toBe(true)
    expect(getCalibrationWarning(wrapper).html()).toMatch(/recommended/i)
  })

  it('displays a warning when its tip length calibration is marked bad', () => {
    mockFindLabwareDefWithCustom.mockReturnValue(
      ({ parameters: { loadName: 'opentrons_96_tiprack_300ul' } }: any)
    )
    mockGetLabwareDisplayName.mockReturnValue('Opentrons 96 Tiprack 300 fancy')

    const wrapper = render({
      calibration: {
        offset: {
          pipette: 'pipette-id-11',
          mount: 'left',
          offset: [1, 2, 3],
          tiprack: 'asdagasdfasdsa',
          tiprackUri: 'opentrons/opentrons_96_tiprack_300ul/1',
          lastModified: '2020-09-10T05:13',
          source: 'user',
          status: {
            markedBad: false,
            source: 'unknown',
            markedAt: '2020-10-09T13:30:00Z',
          },
          id: 'a_pip_id',
        },
        tipLength: {
          id: '1',
          tipLength: 30,
          tiprack: 'asdagasdfasdsa',
          pipette: 'pipette-id-11',
          lastModified: '2020-09-10T05:10Z',
          source: 'user',
          status: {
            markedBad: true,
            source: 'unknown',
            markedAt: '',
          },
        },
      },
    })
    expect(getCalibrationWarning(wrapper).exists()).toBe(true)
    expect(getCalibrationWarning(wrapper).html()).toMatch(/recommended/i)
  })
})
