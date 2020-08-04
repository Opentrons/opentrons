// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
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

  it('displays a Warning for invalid files', () => {
    const SPECS = [
      {
        controlDisabledReason: null,
        hasAvailableUpdate: true,
        expectDisabled: false,
      },
      {
        controlDisabledReason: null,
        hasAvailableUpdate: false,
        expectDisabled: true,
      },
      {
        controlDisabledReason: "Can't touch this",
        hasAvailableUpdate: true,
        expectDisabled: true,
      },
      {
        controlDisabledReason: "Can't touch this",
        hasAvailableUpdate: false,
        expectDisabled: true,
      },
    ]

    SPECS.forEach(
      ({ controlDisabledReason, hasAvailableUpdate, expectDisabled }) => {
        const wrapper = mount(
          <Provider store={store}>
            <ModuleUpdate
              moduleId="FAKEMODULE1234"
              controlDisabledReason={controlDisabledReason}
              hasAvailableUpdate={hasAvailableUpdate}
            />
          </Provider>
        )
        expect(wrapper.find(Button).prop('disabled')).toEqual(expectDisabled)
      }
    )
  })

  it.todo('is available and can control')
  it.todo('is available and cannot control')
  it.todo('is not available and can control')
  it.todo('is not available and cannot control')
})
