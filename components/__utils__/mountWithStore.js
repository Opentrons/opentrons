// @flow
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
|}

export type MountWithStoreOptions<State> = {
  initialState?: State,
  ...
}

export function mountWithStore<Element: React.ElementType, State, Action>(
  node: React.Element<Element>,
  options?: MountWithStoreOptions<State>
): WrapperWithStore<Element, State, Action> {
  const store: MockStore<State, Action> = {
    getState: jest.fn(),
    subscribe: jest.fn(),
    dispatch: jest.fn(),
  }

  if (options && 'initialState' in options) {
    store.getState.mockReturnValue(((options.initialState: any): State))
  }

  const wrapper = mount(node, {
    wrappingComponent: Provider,
    wrappingComponentProps: { store },
  })

  return { wrapper, store }
}
