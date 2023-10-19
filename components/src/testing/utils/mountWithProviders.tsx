import assert from 'assert'
import * as React from 'react'
import { I18nextProvider } from 'react-i18next'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from 'react-query'
import { mount } from 'enzyme'

import type { Store } from 'redux'
import type { MockStore, WrapperWithStore } from './mountWithStore'

export interface MountWithProvidersOptions<State> {
  initialState?: State
  i18nInstance?: React.ComponentProps<typeof I18nextProvider>['i18n']
  provideStore?: boolean
  provideI18n?: boolean
  [key: string]: unknown
}

export function mountWithProviders<Element, State, Action>(
  node: React.ReactElement,
  options?: MountWithProvidersOptions<State>
): WrapperWithStore<Element, State, Action> {
  const {
    provideI18n = true,
    provideStore = true,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    initialState = {} as State,
    i18nInstance = null,
  } = options || {}

  const store: MockStore<State, Action> = {
    getState: jest.fn(() => initialState),
    subscribe: jest.fn(),
    dispatch: jest.fn(),
  }

  const queryClient = new QueryClient()

  const I18nWrapper: React.ElementType<
    React.ComponentProps<typeof I18nextProvider>
  > = provideI18n
    ? ({
        i18n,
        children,
      }: {
        i18n: React.ComponentProps<typeof I18nextProvider>['i18n']
        children?: React.ReactNode
      }): JSX.Element => (
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      )
    : React.Fragment

  interface StateWrapperProps {
    children: React.ReactNode
    store: Store<State>
  }
  const StateWrapper: React.ElementType<StateWrapperProps> = provideStore
    ? ({ store, children }: StateWrapperProps): JSX.Element => (
        <Provider store={store}>{children}</Provider>
      )
    : React.Fragment

  const WrappingComponent = ({
    store,
    children,
    i18n,
  }: {
    children: React.ReactNode
    store: Store<State>
    i18n: React.ComponentProps<typeof I18nextProvider>['i18n']
  }): JSX.Element => (
    <StateWrapper store={store}>
      <QueryClientProvider client={queryClient}>
        <I18nWrapper i18n={i18n}>{children}</I18nWrapper>
      </QueryClientProvider>
    </StateWrapper>
  )

  const wrapper = mount(node, {
    wrappingComponent: WrappingComponent,
    wrappingComponentProps: { store, i18n: i18nInstance },
  })

  // force a re-render by returning a new state to recalculate selectors
  // and sending a blank set of new props to the wrapper
  const refresh = (maybeNextState?: State): void => {
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
