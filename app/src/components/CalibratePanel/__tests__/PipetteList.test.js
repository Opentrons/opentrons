// @flow
import * as React from 'react'
import { StaticRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import * as PipettesSelectors from '../../../pipettes/selectors'
import * as robotSelectors from '../../../robot/selectors'
import * as calibrateSelectors from '../../../nav/calibrate-selectors'

import type { BaseProtocolLabware } from '../../../calibration/types'
import tiprack300Def from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import { fetchTipLengthCalibrations } from '../../../calibration/'
import {
  PipetteListComponent,
  type PipetteListComponentProps,
} from '../PipetteList'

import type { State } from '../../../types'

jest.mock('../../../robot/selectors')
jest.mock('../../../nav/calibrate-selectors')
jest.mock('../../../pipettes/selectors')

const mockGetProtocolPipettes: JestMockFn<
  [State],
  $Call<typeof robotSelectors.getPipettes, State>
> = robotSelectors.getPipettes

const mockGetCalibratePipetteLocations: JestMockFn<
  [State],
  $Call<typeof calibrateSelectors.getCalibratePipettesLocations, State>
> = calibrateSelectors.getCalibratePipettesLocations

const mockGetAttachedPipettes: JestMockFn<[any, string], mixed> =
  PipettesSelectors.getAttachedPipettes

const mockLeftSpecs: any = {
  displayName: 'Left Pipette',
  name: 'mock_left',
  backCompatNames: ['mock_left_legacy'],
}

const mockLeftProtoPipette: any = {
  mount: 'left',
  name: 'mock_left_model',
  modelSpecs: mockLeftSpecs,
}

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

const mockPipetteLocations = {
  left: {
    default: {
      path: '/path/left',
      disabledReason: null,
    },
    'hash-1': {
      path: '/path/left/hash-1',
      disabledReason: null,
    },
    'hash-2': {
      path: '/path/left/hash-2',
      disabledReason: null,
    },
  },
  right: {
    default: {
      path: '/path/right',
      disabledReason: null,
    },
    'hash-3': {
      path: '/path/right/hash-3',
      disabledReason: null,
    },
    'hash-2': {
      path: '/path/right/hash-2',
      disabledReason: null,
    },
  },
}

const mockAttachedPipettes = {
  left: { model: 'p300_single_v2.0' },
  right: null,
}

describe('PipetteListComponent', () => {
  let dispatch
  let mockStore
  let render

  beforeEach(() => {
    dispatch = jest.fn()
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        robotApi: {},
      }),
      dispatch,
    }
    mockGetProtocolPipettes.mockReturnValue([mockLeftProtoPipette])
    mockGetCalibratePipetteLocations.mockReturnValue(mockPipetteLocations)
    mockGetAttachedPipettes.mockReturnValue(mockAttachedPipettes)

    render = (props: PipetteListComponentProps, location: string = '/') => {
      return mount(
        <Provider store={mockStore}>
          <PipetteListComponent {...props} />
        </Provider>,
        {
          wrappingComponent: StaticRouter,
          wrappingComponentProps: { location, context: {} },
        }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('dispatches fetch tip length calibration action on render', () => {
    render({
      robotName: 'robotName',
      tipracks: stubTipRacks,
    })

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      fetchTipLengthCalibrations('robotName')
    )
  })

  it('renders tip length calibration', () => {
    const wrapper = render({
      robotName: 'robotName',
      tipracks: stubTipRacks,
    })
    const component = wrapper.find(PipetteListComponent)

    expect(
      component.find('TitledList[title="Tip Length Calibration"]').exists()
    ).toBe(true)

    stubTipRacks.forEach(tr => {
      expect(
        component.find(`PipetteTiprackListItem[name="${tr.name}"]`).exists()
      ).toBe(true)
    })
  })
})
