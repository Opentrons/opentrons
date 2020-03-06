// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { shallow, mount } from 'enzyme'
import configureMockStore from 'redux-mock-store'

import { Button } from '@opentrons/components'
import { ModuleUpdate } from '../ModuleUpdate'

const mockStore = configureMockStore([])

describe('ModuleUpdate', () => {
  let store
  beforeEach(() => {
    store = mockStore({
      mockState: true,
      robot: {
        connection: { connectedTo: 'BITTER-MOCK' },
      },
      robotApi: {},
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('component renders', () => {
    const treeAvailableCanControl = shallow(
      <Provider store={store}>
        <ModuleUpdate
          canControl={true}
          moduleId="FAKEMODULE1234"
          hasAvailableUpdate={true}
        />
      </Provider>
    )
    const treeAvailableNoControl = shallow(
      <Provider store={store}>
        <ModuleUpdate
          canControl={false}
          moduleId="FAKEMODULE1234"
          hasAvailableUpdate={true}
        />
      </Provider>
    )
    const treeNotAvailableCanControl = shallow(
      <Provider store={store}>
        <ModuleUpdate
          canControl={true}
          moduleId="FAKEMODULE1234"
          hasAvailableUpdate={false}
        />
      </Provider>
    )
    const treeNotAvailableNoControl = shallow(
      <Provider store={store}>
        <ModuleUpdate
          canControl={false}
          moduleId="FAKEMODULE1234"
          hasAvailableUpdate={false}
        />
      </Provider>
    )
    expect(treeAvailableCanControl).toMatchSnapshot()
    expect(treeNotAvailableCanControl).toMatchSnapshot()
    expect(treeAvailableNoControl).toMatchSnapshot()
    expect(treeNotAvailableNoControl).toMatchSnapshot()
  })

  it('displays a Warning for invalid files', () => {
    const SPECS = [
      {
        canControl: true,
        hasAvailableUpdate: true,
        expectDisabled: false,
      },
      {
        canControl: true,
        hasAvailableUpdate: false,
        expectDisabled: true,
      },
      {
        canControl: false,
        hasAvailableUpdate: true,
        expectDisabled: true,
      },
      {
        canControl: false,
        hasAvailableUpdate: false,
        expectDisabled: true,
      },
    ]

    SPECS.forEach(({ canControl, hasAvailableUpdate, expectDisabled }) => {
      const wrapper = mount(
        <Provider store={store}>
          <ModuleUpdate
            moduleId="FAKEMODULE1234"
            canControl={canControl}
            hasAvailableUpdate={hasAvailableUpdate}
          />
        </Provider>
      )
      expect(wrapper.find(Button).prop('disabled')).toEqual(expectDisabled)
    })
  })
})
