// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'

import type { State } from '../../../types'
import { selectors as robotSelectors } from '../../../robot'
import { getConnectedRobot } from '../../../discovery'
import {
  getProtocolLabwareList,
  fetchLabwareCalibrations,
} from '../../../calibration/labware'
import { LabwareGroup } from '../LabwareGroup'

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

const mockGetConnectedRobot: JestMockFn<
  [State],
  $Call<typeof getConnectedRobot, State>
> = getConnectedRobot

const mockGetModulesBySlot: JestMockFn<
  [State],
  $Call<typeof robotSelectors.getModulesBySlot, State>
> = robotSelectors.getModulesBySlot

const mockGetProtocolLabwareList: JestMockFn<
  [State, string],
  $Call<typeof getProtocolLabwareList, State, string>
> = getProtocolLabwareList

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
    const wrapper = render()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      fetchLabwareCalibrations('robot-name')
    )
  })
})
