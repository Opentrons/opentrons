import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { GlobalStyle } from '../app/src/atoms/GlobalStyle'
import { i18n } from '../app/src/i18n'

export const customViewports = {
  onDeviceDisplay: {
    name: 'Touchscreen',
    type: 'tablet',
    styles: {
      width: '1024px',
      height: '600px',
    },
  },
}

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  viewport: { viewports: customViewports },
  options: {
    storySort: {
      method: 'alphabetical',
      order: ['Design Tokens', 'Library', 'App', 'ODD', 'AI'],
    },
  },
}

// Global decorator to apply the styles to all stories
export const decorators = [
  Story => (
    <I18nextProvider i18n={i18n}>
      <GlobalStyle />
      <Story />
    </I18nextProvider>
  ),
]
