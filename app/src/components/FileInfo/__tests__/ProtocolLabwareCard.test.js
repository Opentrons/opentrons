// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
import noop from 'lodash/noop'

import * as Calibration from '../../../calibration'
import { ProtocolLabwareCard } from '../ProtocolLabwareCard'
import { ProtocolLabwareList } from '../ProtocolLabwareList'
import { InfoSection } from '../InfoSection'

import type { State } from '../../../types'

jest.mock('../../../calibration')

const MOCK_STATE: State = ({ mockState: true }: any)

const MOCK_STORE = {
  getState: () => MOCK_STATE,
  dispatch: noop,
  subscribe: noop,
}
const ROBOT_NAME = 'robotName'

const getProtocolLabwareList: JestMockFn<
  [State, string],
  $Call<typeof Calibration.getProtocolLabwareList, State, string>
> = Calibration.getProtocolLabwareList

function stubSelector<R>(mock: JestMockFn<[State, string], R>, rVal: R) {
  mock.mockImplementation((state, robotName) => {
    expect(state).toBe(MOCK_STATE)
    expect(robotName).toBe(ROBOT_NAME)
    return rVal
  })
}

describe('ProtocolLabwareCard', () => {
  const render = () => {
    return mount(<ProtocolLabwareCard robotName={ROBOT_NAME} />, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store: MOCK_STORE },
    })
  }

  const EMPTY_LABWARE = []
  const FULL_LABWARE = [
    {
      quantity: 2,
      calibration: null,
      parentDisplayName: null,
      displayName: 'LABWARE DISPLAY NAME',
      legacy: false,
    },
  ]

  beforeEach(() => {
    stubSelector(getProtocolLabwareList, FULL_LABWARE)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders nothing when no labware exists in the protocol', () => {
    stubSelector(getProtocolLabwareList, EMPTY_LABWARE)
    const wrapper = render()
    expect(wrapper).toEqual({})
  })

  it('renders an info section with a title if there are labware', () => {
    const wrapper = render()
    const infoSection = wrapper.find(InfoSection)
    expect(infoSection.prop('title')).toEqual('Required Labware')
  })

  it('passes labware list from selector to ProtocolLabwareList', () => {
    const wrapper = render()
    const labwareList = wrapper.find(ProtocolLabwareList)
    expect(labwareList.prop('labware')).toEqual(FULL_LABWARE)
  })
})
