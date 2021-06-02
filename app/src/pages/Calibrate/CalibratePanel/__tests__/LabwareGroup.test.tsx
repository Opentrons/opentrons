import * as React from 'react'
import { mountWithProviders } from '@opentrons/components/__utils__'

import { i18n } from '../../../../i18n'
import wellPlate96Def from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import tiprack300Def from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import type { BaseProtocolLabware } from '../../../../redux/calibration/labware/types'
import { selectors as robotSelectors } from '../../../../redux/robot'
import { fetchLabwareCalibrations } from '../../../../redux/calibration/labware'
import { LabwareGroup } from '../LabwareGroup'

jest.mock('../../../../redux/robot/selectors')
jest.mock('../../../../redux/calibration/labware/selectors')

const mockGetCalibratorMount = robotSelectors.getCalibratorMount as jest.MockedFunction<
  typeof robotSelectors.getCalibratorMount
>

const mockGetDeckPopulated = robotSelectors.getDeckPopulated as jest.MockedFunction<
  typeof robotSelectors.getDeckPopulated
>

const mockGetTipracksConfirmed = robotSelectors.getTipracksConfirmed as jest.MockedFunction<
  typeof robotSelectors.getTipracksConfirmed
>

const mockGetIsRunning = robotSelectors.getIsRunning as jest.MockedFunction<
  typeof robotSelectors.getIsRunning
>

const mockGetConnectedRobotName = robotSelectors.getConnectedRobotName as jest.MockedFunction<
  typeof robotSelectors.getConnectedRobotName
>

const mockGetModulesBySlot = robotSelectors.getModulesBySlot as jest.MockedFunction<
  typeof robotSelectors.getModulesBySlot
>

const stubTipRacks: BaseProtocolLabware[] = [
  {
    type: 'some_tiprack',
    definition: tiprack300Def,
    slot: '3',
    name: 'some tiprack',
    calibratorMount: 'left',
    isTiprack: true,
    confirmed: true,
    parent: null,
    calibrationData: null,
  } as any,
  {
    type: 'some_other_tiprack',
    definition: null,
    slot: '1',
    name: 'some other tiprack',
    calibratorMount: 'left',
    isTiprack: true,
    confirmed: true,
    parent: null,
    calibrationData: null,
  } as any,
]

const stubOtherLabware: BaseProtocolLabware[] = [
  {
    type: 'some_wellplate',
    definition: wellPlate96Def,
    slot: '4',
    name: 'some wellplate',
    calibratorMount: 'left',
    isTiprack: false,
    confirmed: true,
    parent: null,
    calibrationData: null,
  } as any,
  {
    type: 'some_other_wellplate',
    definition: wellPlate96Def,
    slot: '7',
    name: 'some other wellplate',
    calibratorMount: 'left',
    isTiprack: false,
    confirmed: true,
    parent: null,
    calibrationData: null,
  } as any,
]

describe('LabwareGroup', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof LabwareGroup>>
  ) => ReturnType<typeof mountWithProviders>

  beforeEach(() => {
    mockGetConnectedRobotName.mockReturnValue('robotName')
    mockGetCalibratorMount.mockReturnValue('left')
    mockGetDeckPopulated.mockReturnValue(true)
    mockGetTipracksConfirmed.mockReturnValue(false)
    mockGetModulesBySlot.mockReturnValue({})

    render = (props = {}) => {
      const {
        robotName = 'robotName',
        tipracks = stubTipRacks,
        otherLabware = stubOtherLabware,
      } = props
      return mountWithProviders(
        <LabwareGroup
          robotName={robotName}
          tipracks={tipracks}
          otherLabware={otherLabware}
        />,
        { i18n }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('dispatches fetch labware calibration action on render', () => {
    const { store } = render()

    expect(store.dispatch).toHaveBeenCalledWith(
      fetchLabwareCalibrations('robotName')
    )
  })

  it('is enabled if robot is not running', () => {
    mockGetIsRunning.mockReturnValue(false)
    const { wrapper } = render()

    expect(wrapper.find('SidePanelGroup[disabled=false]').exists()).toBe(true)
  })

  it('is disabled if robot is running', () => {
    mockGetIsRunning.mockReturnValue(true)
    const { wrapper } = render()

    expect(wrapper.find('SidePanelGroup[disabled=true]').exists()).toBe(true)
  })

  it('is renders tipracks and labware if present', () => {
    const { wrapper } = render()

    stubTipRacks.forEach(lw => {
      expect(wrapper.find(`LabwareListItem[name="${lw.name}"]`).exists()).toBe(
        true
      )
    })
    stubOtherLabware.forEach(lw => {
      expect(wrapper.find(`LabwareListItem[name="${lw.name}"]`).exists()).toBe(
        true
      )
    })
  })
})
