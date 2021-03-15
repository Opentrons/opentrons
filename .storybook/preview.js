export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
}

import React from 'react'

import { GlobalStyle } from '../app/src/atoms/GlobalStyle'

// Global decorator to apply the styles to all stories
export const decorators = [
  Story => (
    <>
      <GlobalStyle />
      <Story />
    </>
  ),
]
