// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
import noop from 'lodash/noop'

import type { State } from '../../../types'

import { ProtocolLabwareCard } from '../ProtocolLabwareCard'
import { ProtocolLabwareList } from '../ProtocolLabwareList'
import * as labwareSelect from '../../../calibration'

jest.mock('../../../calibration')

const MOCK_STATE: State = ({ mockState: true }: any)
const MOCK_STORE = {
  getState: () => MOCK_STATE,
  dispatch: noop,
  subscribe: noop,
}
const ROBOT_NAME = 'randomRobot'

const associateLabwareWithCalibration: JestMockFn<
  [State, string],
  $Call<typeof labwareSelect.associateLabwareWithCalibration, State, string>
> = labwareSelect.associateLabwareWithCalibration

function stubSelector<R>(mock: JestMockFn<[State, string], R>, rVal: R) {
  mock.mockImplementation(state => {
    expect(state).toBe(MOCK_STATE)
    return rVal
  })
}

describe('Protocol Labware Card Component', () => {
  const render = (robotName = ROBOT_NAME) => {
    return mount(
      <Provider store={MOCK_STORE}>
        <ProtocolLabwareCard robotName={robotName} />
      </Provider>
    )
  }

  const EMPTY_LABWARE = []
  const FULL_LABWARE = [
    {
      quantity: 2,
      calibration: null,
      parent: '',
      display: 'LABWARE DISPLAY NAME',
    },
  ]

  beforeEach(() => {
    stubSelector(associateLabwareWithCalibration, FULL_LABWARE)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders nothing when no labware exists in the protocol', () => {
    stubSelector(associateLabwareWithCalibration, EMPTY_LABWARE)
    const wrapper = render()
    expect(wrapper).toEqual({})
  })

  it('passes in corectly formatted quantity and calibration to labware list', () => {
    const wrapper = render()
    const labwareList = wrapper.find(ProtocolLabwareList)
    const props = labwareList.props()
    const expected = {
      parent: '',
      quantity: 2,
      display: 'LABWARE DISPLAY NAME',
      calibration: null,
    }
    expect(labwareList.exists()).toEqual(true)
    expect(props.loadNameMap).toEqual([expected])
    const tbody = labwareList.find('tbody')
    expect(tbody).toHaveLength(1)
    expect(tbody.find('tr').find('td').length).toEqual(3)
  })
})
