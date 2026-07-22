// render using targeted component using @testing-library/react
// with wrapping providers for i18next and react-query

import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from 'react-query'
import { render } from '@testing-library/react'

import type { RenderOptions, RenderResult } from '@testing-library/react'
import type {
  ComponentProps,
  ComponentType,
  PropsWithChildren,
  ReactElement,
} from 'react'

export interface RenderWithProvidersOptions extends RenderOptions {
  i18nInstance?: ComponentProps<typeof I18nextProvider>['i18n']
}

export function renderWithProviders(
  Component: ReactElement,
  options?: RenderWithProvidersOptions
): [RenderResult] {
  const { i18nInstance = null, ...renderOptions } = options || {}

  const queryClient = new QueryClient()

  const ProviderWrapper: ComponentType<PropsWithChildren<{}>> = ({
    children,
  }) => {
    const BaseWrapper = (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    if (i18nInstance != null) {
      return (
        <I18nextProvider i18n={i18nInstance}>{BaseWrapper}</I18nextProvider>
      )
    }
    return BaseWrapper
  }

  return [render(Component, { wrapper: ProviderWrapper, ...renderOptions })]
}
