// render using targetted component using @testing-library/react
// with wrapping provider for i18next when needed

import { I18nextProvider } from 'react-i18next'
import { render } from '@testing-library/react'

import type { RenderOptions, RenderResult } from '@testing-library/react'
import type { ComponentProps, ReactElement } from 'react'

export interface RenderWithProvidersOptions extends RenderOptions {
  i18nInstance?: ComponentProps<typeof I18nextProvider>['i18n']
}

export function renderWithProviders(
  Component: ReactElement,
  options?: RenderWithProvidersOptions
): [RenderResult] {
  const { i18nInstance = null, ...renderOptions } = options ?? {}

  const componentToRender =
    i18nInstance != null ? (
      <I18nextProvider i18n={i18nInstance}>{Component}</I18nextProvider>
    ) : (
      Component
    )

  return [render(componentToRender, renderOptions)]
}
