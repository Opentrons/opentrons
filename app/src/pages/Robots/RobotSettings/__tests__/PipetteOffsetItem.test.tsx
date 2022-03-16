import * as React from 'react'
import { mountWithProviders } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { i18n } from '../../../../i18n'
import { PipetteOffsetItem } from '../PipetteOffsetItem'
import { findLabwareDefWithCustom } from '../../../../assets/labware/findLabware'

import type { ReactWrapper } from 'enzyme'
import type { State, Action } from '../../../../redux/types'
import type { WrapperWithStore } from '@opentrons/components'
import type {
  AttachedPipette,
  PipetteCalibrations,
} from '../../../../redux/pipettes/types'

jest.mock('../../../../assets/labware/findLabware')

jest.mock('@opentrons/shared-data', () => ({
  getAllPipetteNames: jest.fn(
    jest.requireActual('@opentrons/shared-data').getAllPipetteNames
  ),
  getPipetteNameSpecs: jest.fn(
    jest.requireActual('@opentrons/shared-data').getPipetteNameSpecs
  ),
  getLabwareDisplayName: jest.fn(),
}))

const mockFindLabwareDefWithCustom = findLabwareDefWithCustom as jest.MockedFunction<
  typeof findLabwareDefWithCustom
>

const mockGetLabwareDisplayName = getLabwareDisplayName as jest.MockedFunction<
  typeof getLabwareDisplayName
>

const getMountLabel = (
  wrapper: ReactWrapper<React.ComponentProps<typeof PipetteOffsetItem>>
): ReactWrapper => wrapper.find('h4')

const getPipetteName = (
  wrapper: ReactWrapper<React.ComponentProps<typeof PipetteOffsetItem>>
): ReactWrapper => wrapper.find('p').at(1)
const getNotCalibrated = (
  wrapper: ReactWrapper<React.ComponentProps<typeof PipetteOffsetItem>>
): ReactWrapper => wrapper.find('p').at(1)
const getCalibrationText = (
  wrapper: ReactWrapper<React.ComponentProps<typeof PipetteOffsetItem>>
): ReactWrapper => wrapper.find('p')
const getCalibrationTime = (
  wrapper: ReactWrapper<React.ComponentProps<typeof PipetteOffsetItem>>
): ReactWrapper => wrapper.find('p').at(3)
const getCalibrationTiprack = (
  wrapper: ReactWrapper<React.ComponentProps<typeof PipetteOffsetItem>>
): ReactWrapper => wrapper.find('p').at(5)
const getCalibrationWarning = (
  wrapper: ReactWrapper<React.ComponentProps<typeof PipetteOffsetItem>>
): ReactWrapper => wrapper.find('InlineCalibrationWarning')

describe('PipetteOffsetItem', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof PipetteOffsetItem>>
  ) => WrapperWithStore<
    React.ComponentProps<typeof PipetteOffsetItem>,
    State,
    Action
  >

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
          modelSpecs: { displayName: 'P300 Single GEN2' },
        } as AttachedPipette,
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
      return mountWithProviders<
        React.ComponentProps<typeof PipetteOffsetItem>,
        State,
        Action
      >(
        <PipetteOffsetItem
          mount={mount}
          pipette={pipette}
          calibration={calibration}
          customLabware={customLabware}
        />,
        { i18n: i18n }
      )
    }
  })

  it('renders acceptably when talking to a robot with cal data but no status', () => {
    const { wrapper } = render({
      calibration: {
        offset: {
          pipette: 'pipette-id-11',
          mount: 'left',
          offset: [1, 2, 3],
          tiprack: 'asdagasdfasdsa',
          tiprackUri: 'opentrons/opentrons_96_tiprack_300ul/1',
          lastModified: '2020-09-10T05:13Z',
          source: 'user',
          id: 'a_pip_id',
        },
        tipLength: {
          id: '1',
          tipLength: 30,
          tiprack: 'asdagasdfasdsa',
          pipette: 'pipette-id-11',
          lastModified: '2020-09-10T05:10Z',
          source: 'user',
        },
      } as PipetteCalibrations,
    })
    expect(wrapper.find('PipetteOffsetItem')).not.toBeNull()
  })

  it('shows null when no pipette present', () => {
    const { wrapper } = render({ pipette: null })
    expect(getMountLabel(wrapper).text()).toEqual('left mount')
    expect(getCalibrationText(wrapper).text()).toMatch(/no pipette attached/i)
    expect(getCalibrationWarning(wrapper).exists()).toBe(false)
  })

  it('says when you havent calibrated', () => {
    const { wrapper } = render({ calibration: null })
    expect(getMountLabel(wrapper).text()).toEqual('left mount')
    expect(getNotCalibrated(wrapper).text()).toMatch(/calibration required/i)
    expect(getCalibrationWarning(wrapper).exists()).toBe(true)
  })

  it('displays date and tiprack display name from def', () => {
    mockFindLabwareDefWithCustom.mockReturnValue({
      parameters: { loadName: 'opentrons_96_tiprack_300ul' },
    } as any)
    mockGetLabwareDisplayName.mockReturnValue('Opentrons 96 Tiprack 300 fancy')

    const { wrapper } = render()
    expect(mockFindLabwareDefWithCustom).toHaveBeenCalledWith(
      'opentrons',
      'opentrons_96_tiprack_300ul',
      null,
      []
    )
    expect(mockGetLabwareDisplayName).toHaveBeenCalledWith({
      parameters: { loadName: 'opentrons_96_tiprack_300ul' },
    })
    expect(getMountLabel(wrapper).text()).toEqual('left mount')
    expect(getPipetteName(wrapper).text()).toEqual('P300 Single GEN2')
    expect(getCalibrationTime(wrapper).text()).toMatch(/September 10/)
    expect(getCalibrationTiprack(wrapper).text()).toMatch(
      /Opentrons 96 Tiprack 300/
    )
    expect(getCalibrationWarning(wrapper).exists()).toBe(false)
  })

  it('displays a warning when its offset calibration is marked bad', () => {
    mockFindLabwareDefWithCustom.mockReturnValue({
      parameters: { loadName: 'opentrons_96_tiprack_300ul' },
    } as any)
    mockGetLabwareDisplayName.mockReturnValue('Opentrons 96 Tiprack 300 fancy')

    const { wrapper } = render({
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
    mockFindLabwareDefWithCustom.mockReturnValue({
      parameters: { loadName: 'opentrons_96_tiprack_300ul' },
    } as any)
    mockGetLabwareDisplayName.mockReturnValue('Opentrons 96 Tiprack 300 fancy')

    const { wrapper } = render({
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
