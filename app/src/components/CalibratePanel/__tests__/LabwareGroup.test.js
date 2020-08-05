// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'

import wellPlate96Def from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import tiprack300Def from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import type { State } from '../../../types'
import type { BaseProtocolLabware } from '../../../calibration/labware/types'
import { selectors as robotSelectors } from '../../../robot'
import {
  getProtocolLabwareList,
  fetchLabwareCalibrations,
} from '../../../calibration/labware'
import { LabwareGroup } from '../LabwareGroup'

jest.mock('../../../robot/selectors')
jest.mock('../../../calibration/labware/selectors')

const mockGetCalibratorMount: JestMockFn<
  [State],
  $Call<typeof robotSelectors.getCalibratorMount, State>
> = robotSelectors.getCalibratorMount

const mockGetDeckPopulated: JestMockFn<
  [State],
  $Call<typeof robotSelectors.getDeckPopulated, State>
> = robotSelectors.getDeckPopulated

const mockGetTipracksConfirmed: JestMockFn<
  [State],
  $Call<typeof robotSelectors.getTipracksConfirmed, State>
> = robotSelectors.getTipracksConfirmed

const mockGetIsRunning: JestMockFn<
  [State],
  $Call<typeof robotSelectors.getIsRunning, State>
> = robotSelectors.getIsRunning

const mockGetConnectedRobotName: JestMockFn<
  [State],
  $Call<typeof robotSelectors.getConnectedRobotName, State>
> = robotSelectors.getConnectedRobotName

const mockGetModulesBySlot: JestMockFn<
  [State],
  $Call<typeof robotSelectors.getModulesBySlot, State>
> = robotSelectors.getModulesBySlot

const mockGetProtocolLabwareList: JestMockFn<
  [State, string],
  $Call<typeof getProtocolLabwareList, State, string>
> = getProtocolLabwareList

const stubTipRacks = [
  ({
    type: 'some_tiprack',
    definition: tiprack300Def,
    slot: '3',
    name: 'some tiprack',
    calibratorMount: 'left',
    isTiprack: true,
    confirmed: true,
    parent: null,
    calibrationData: null,
  }: $Shape<BaseProtocolLabware>),
  ({
    type: 'some_other_tiprack',
    definition: null,
    slot: '1',
    name: 'some other tiprack',
    calibratorMount: 'left',
    isTiprack: true,
    confirmed: true,
    parent: null,
    calibrationData: null,
  }: $Shape<BaseProtocolLabware>),
]

const stubOtherLabware = [
  ({
    type: 'some_wellplate',
    definition: wellPlate96Def,
    slot: '4',
    name: 'some wellplate',
    calibratorMount: 'left',
    isTiprack: false,
    confirmed: true,
    parent: null,
    calibrationData: null,
  }: $Shape<BaseProtocolLabware>),
  ({
    type: 'some_other_wellplate',
    definition: wellPlate96Def,
    slot: '7',
    name: 'some other wellplate',
    calibratorMount: 'left',
    isTiprack: false,
    confirmed: true,
    parent: null,
    calibrationData: null,
  }: $Shape<BaseProtocolLabware>),
]

describe('LabwareGroup', () => {
  let render
  let mockStore
  let dispatch

  beforeEach(() => {
    dispatch = jest.fn()
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        robotApi: {},
      }),
      dispatch,
    }
    mockGetConnectedRobotName.mockReturnValue('robotName')
    mockGetCalibratorMount.mockReturnValue('left')
    mockGetDeckPopulated.mockReturnValue(true)
    mockGetTipracksConfirmed.mockReturnValue(false)
    mockGetModulesBySlot.mockReturnValue({})
    mockGetProtocolLabwareList.mockReturnValue([
      ...stubTipRacks,
      ...stubOtherLabware,
    ])
    render = () => {
      return mount(<LabwareGroup />, {
        wrappingComponent: Provider,
        wrappingComponentProps: { store: mockStore },
      })
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('dispatches fetch labware calibration action on render', () => {
    render()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      fetchLabwareCalibrations('robotName')
    )
  })

  it('is enabled if robot is not running', () => {
    mockGetIsRunning.mockReturnValue(false)
    const wrapper = render()

    expect(wrapper.find('SidePanelGroup[disabled=false]').exists()).toBe(true)
  })

  it('is disabled if robot is running', () => {
    mockGetIsRunning.mockReturnValue(true)
    const wrapper = render()

    expect(wrapper.find('SidePanelGroup[disabled=true]').exists()).toBe(true)
  })

  it('is renders tipracks and labware if present', () => {
    const wrapper = render()

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
