// @flow
import { Button } from '@opentrons/components'
import { mount } from 'enzyme'
import * as React from 'react'
import { Provider } from 'react-redux'
import configureMockStore from 'redux-mock-store'

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

  // TODO(mc, 2020-03-16): these shallow snapshots don't test anything
  // remove commented out tests when actual tests have been written
  // it('component renders', () => {
  //   const treeAvailableCanControl = shallow(
  //     <Provider store={store}>
  //       <ModuleUpdate
  //         controlDisabledReason={null}
  //         moduleId="FAKEMODULE1234"
  //         hasAvailableUpdate={true}
  //       />
  //     </Provider>,
  //   )
  //   const treeAvailableNoControl = shallow(
  //     <Provider store={store}>
  //       <ModuleUpdate
  //         controlDisabledReason={"Can't touch this"}
  //         moduleId="FAKEMODULE1234"
  //         hasAvailableUpdate={true}
  //       />
  //     </Provider>
  //   )
  //   const treeNotAvailableCanControl = shallow(
  //     <Provider store={store}>
  //       <ModuleUpdate
  //         controlDisabledReason={null}
  //         moduleId="FAKEMODULE1234"
  //         hasAvailableUpdate={false}
  //       />
  //     </Provider>
  //   )
  //   const treeNotAvailableNoControl = shallow(
  //     <Provider store={store}>
  //       <ModuleUpdate
  //         controlDisabledReason={"Can't touch this"}
  //         moduleId="FAKEMODULE1234"
  //         hasAvailableUpdate={false}
  //       />
  //     </Provider>
  //   )
  //   expect(treeAvailableCanControl).toMatchSnapshot()
  //   expect(treeNotAvailableCanControl).toMatchSnapshot()
  //   expect(treeAvailableNoControl).toMatchSnapshot()
  //   expect(treeNotAvailableNoControl).toMatchSnapshot()
  // })

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
})
