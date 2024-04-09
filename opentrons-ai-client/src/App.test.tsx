import React from 'react'
import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { renderWithProviders } from './__testing-utils__'

import { App } from './App'

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<App />)
}

describe('App', () => {
  it('should render text', () => {
    render()
    screen.getByText('Opentrons AI')
  })
})
