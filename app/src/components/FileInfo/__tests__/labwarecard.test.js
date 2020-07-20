// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import type { State } from '../../../types'

import { ProtocolLabwareCard } from '../ProtocolLabwareCard'
import { ProtocolLabwareList } from '../ProtocolLabwareList'
import * as protocolSelect from '../../../protocol'

jest.mock('../../../protocol')

const MOCK_STATE: State = ({ mockState: true }: any)
const ROBOT_NAME = 'randomRobot'

const associateLabwareWithCalibration: JestMockFn<
  [State, string],
  $Call<typeof protocolSelect.associateLabwareWithCalibration, State, string>
> = protocolSelect.associateLabwareWithCalibration

function stubSelector<R>(mock: JestMockFn<[State, string], R>, rVal: R) {
  mock.mockImplementation(state => {
    expect(state).toBe(MOCK_STATE)
    return rVal
  })
}

describe('Protocol Labware Card Component', () => {
  const render = (robotName = ROBOT_NAME) => {
    return mount(<ProtocolLabwareCard robotName={robotName} />)
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
      quantity: 2,
      calibration: 'Not yet calibrated',
      parent: '',
      display: 'LABWARE DIPSLAY NAME',
    }
    expect(labwareList.exists()).toEqual(true)
    expect(props.loadNameMap).toEqual(expected)
    const tbody = labwareList.find('tbody')
    expect(tbody).toHaveLength(1)
    expect(tbody.find('tr').find('td').length).toEqual(6)
  })
})
