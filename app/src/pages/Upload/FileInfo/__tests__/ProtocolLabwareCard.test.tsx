import * as React from 'react'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
import noop from 'lodash/noop'

import * as Calibration from '../../../../redux/calibration'
import { ProtocolLabwareCard } from '../ProtocolLabwareCard'
import { ProtocolLabwareList } from '../ProtocolLabwareList'
import { InfoSection } from '../InfoSection'

import type { State } from '../../../../redux/types'

jest.mock('../../../../redux/calibration')

const MOCK_STATE: State = { mockState: true } as any

const MOCK_STORE = {
  getState: () => MOCK_STATE,
  dispatch: noop,
  subscribe: noop,
}
const ROBOT_NAME = 'robotName'

const getUniqueProtocolLabwareSummaries = Calibration.getUniqueProtocolLabwareSummaries as jest.MockedFunction<
  typeof Calibration.getUniqueProtocolLabwareSummaries
>

function stubSelector(
  mock: jest.MockedFunction<
    typeof Calibration.getUniqueProtocolLabwareSummaries
  >,
  rVal: ReturnType<typeof Calibration.getUniqueProtocolLabwareSummaries>
): void {
  mock.mockImplementation(
    (
      state,
      robotName
    ): ReturnType<typeof Calibration.getUniqueProtocolLabwareSummaries> => {
      expect(state).toBe(MOCK_STATE)
      expect(robotName).toBe(ROBOT_NAME)
      return rVal
    }
  )
}

describe('ProtocolLabwareCard', () => {
  const render = (): ReturnType<typeof mount> => {
    return mount(<ProtocolLabwareCard robotName={ROBOT_NAME} />, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store: MOCK_STORE },
    })
  }

  const EMPTY_LABWARE: ReturnType<
    typeof Calibration.getUniqueProtocolLabwareSummaries
  > = []
  const FULL_LABWARE = [
    {
      quantity: 2,
      calibration: null,
      parentDisplayName: null,
      displayName: 'LABWARE DISPLAY NAME',
      calDataAvailable: true,
    },
  ]

  beforeEach(() => {
    stubSelector(getUniqueProtocolLabwareSummaries, FULL_LABWARE)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders nothing when no labware exists in the protocol', () => {
    stubSelector(getUniqueProtocolLabwareSummaries, EMPTY_LABWARE)
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
