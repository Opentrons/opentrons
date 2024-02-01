// render using targetted component using @testing-library/react
// with wrapping providers for i18next and redux
import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { I18nextProvider } from 'react-i18next'
import { Provider } from 'react-redux'
import { render, RenderResult } from '@testing-library/react'
import { createStore } from 'redux'

import type { Store } from 'redux'
import type { RenderOptions } from '@testing-library/react'

export interface RenderWithProvidersOptions<State> extends RenderOptions {
  initialState?: State
  i18nInstance: React.ComponentProps<typeof I18nextProvider>['i18n']
}

export function renderWithProviders<State>(
  Component: React.ReactElement,
  options?: RenderWithProvidersOptions<State>
): [RenderResult, Store<State>] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { initialState = {} as State, i18nInstance = null } = options || {}

  const store: Store<State> = createStore(jest.fn(), initialState)
  store.dispatch = jest.fn()
  store.getState = jest.fn(() => initialState)

  const queryClient = new QueryClient()

  const ProviderWrapper: React.ComponentType<React.PropsWithChildren<{}>> = ({
    children,
  }) => {
    const BaseWrapper = (
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>{children}</Provider>
      </QueryClientProvider>
    )
    if (i18nInstance != null) {
      return (
        <I18nextProvider i18n={i18nInstance}>{BaseWrapper}</I18nextProvider>
      )
    } else {
      return BaseWrapper
    }
  }

  return [render(Component, { wrapper: ProviderWrapper }), store]
}
