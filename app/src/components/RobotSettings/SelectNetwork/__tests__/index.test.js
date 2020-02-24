// @flow

import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import { SelectNetwork } from '..'

import { CONNECTABLE } from '../../../../discovery'

import type { State } from '../../../types'
import type { ViewableRobot } from '../../../../discovery/types'

const mockRobot: ViewableRobot = ({
  name: 'robot-name',
  connected: true,
  status: CONNECTABLE,
}: any)

const mockState = {
  networking: {
    'robot-name': {},
  },
  superDeprecatedRobotApi: {
    api: { 'robot-name': {} },
  },
  robotApi: {},
}

describe('<SelectNetwork />', () => {
  let dispatch
  let mockStore
  let render

  beforeEach(() => {
    dispatch = jest.fn()
    mockStore = {
      dispatch,
      subscribe: () => {},
      getState: () => ({ ...mockState }: State),
    }

    render = (robot: ViewableRobot = mockRobot) =>
      mount(<SelectNetwork robot={robot} />, {
        wrappingComponent: Provider,
        wrappingComponentProps: { store: mockStore },
      })
  })

  test('renders components correctly', () => {
    render()
  })
})
