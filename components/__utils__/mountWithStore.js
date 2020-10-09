// @flow
import assert from 'assert'
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import type { ReactWrapper } from 'enzyme'

export type MockStore<State, Action> = {|
  getState: JestMockFn<[], State>,
  subscribe: JestMockFn<[], void>,
  dispatch: JestMockFn<[Action], Action>,
|}

export type WrapperWithStore<Element, State, Action> = {|
  wrapper: ReactWrapper<Element>,
  store: MockStore<State, Action>,
  refresh: (nextState?: State) => void,
|}

export type MountWithStoreOptions<State> = {
  initialState?: State,
  ...
}

export function mountWithStore<Element: React.ElementType, State, Action>(
  node: React.Element<Element>,
  options?: MountWithStoreOptions<State>
): WrapperWithStore<Element, State, Action> {
  const initialState = options?.initialState ?? (({}: any): State)

  const store: MockStore<State, Action> = {
    getState: jest.fn(() => initialState),
    subscribe: jest.fn(),
    dispatch: jest.fn(),
  }

  const wrapper = mount(node, {
    wrappingComponent: Provider,
    wrappingComponentProps: { store },
  })

  // force a re-render by returning a new state to recalculate selectors
  // and sending a blank set of new props to the wrapper
  const refresh = maybeNextState => {
    const nextState = maybeNextState ?? { ...initialState }

    assert(
      nextState !== initialState,
      'nextState must be different than initialState to trigger a re-render'
    )

    store.getState.mockReturnValue(nextState)
    wrapper.setProps({})
  }

  return { wrapper, store, refresh }
}
