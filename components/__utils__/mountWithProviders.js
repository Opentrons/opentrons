// @flow
import assert from 'assert'
import * as React from 'react'
import { I18nextProvider } from 'react-i18next'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import type { MockStore, WrapperWithStore } from './mountWithStore'

export type MountWithProvidersOptions<State> = {
  initialState?: State,
  i18nInstance?: $PropertyType<
    React.ElementProps<typeof I18nextProvider>,
    'i18n'
  >,
  provideStore?: boolean,
  provideI18n?: boolean,
  ...
}

export function mountWithProviders<Element: React.ElementType, State, Action>(
  node: React.Element<Element>,
  options?: MountWithProvidersOptions<State>
): WrapperWithStore<Element, State, Action> {
  const {
    provideI18n = true,
    provideStore = true,
    initialState = (({}: any): State),
    i18nInstance = null,
  } = options || {}

  const store: MockStore<State, Action> = {
    getState: jest.fn(() => initialState),
    subscribe: jest.fn(),
    dispatch: jest.fn(),
  }

  const I18nWrapper = provideI18n
    ? ({
        i18n,
        children,
      }: {|
        i18n: $PropertyType<React.ElementProps<typeof I18nextProvider>, 'i18n'>,
        children: React.Node,
      |}) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    : React.Fragment
  const StateWrapper = provideStore
    ? ({ store, children }: {| children: React.Node, store: State |}) => (
        <Provider store={store}>{children}</Provider>
      )
    : React.Fragment

  const WrappingComponent = ({
    store,
    children,
    i18n,
  }: {|
    children: React.Node,
    store: State,
    i18n: $PropertyType<React.ElementProps<typeof I18nextProvider>, 'i18n'>,
  |}) => (
    <StateWrapper store={store}>
      <I18nWrapper i18n={i18n}>{children}</I18nWrapper>
    </StateWrapper>
  )

  const wrapper = mount(node, {
    wrappingComponent: WrappingComponent,
    wrappingComponentProps: { store, i18n: i18nInstance },
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
