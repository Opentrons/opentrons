import { describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'

import { SleepScreen } from '..'

const render = () => {
  return renderWithProviders(<SleepScreen aria-label="Exit sleep mode" />)
}

describe('SleepScreen', () => {
  it('should render empty screen', () => {
    render()
    const touchScreen = screen.getByRole('button', { name: 'Exit sleep mode' })
    expect(touchScreen).toBeInTheDocument()
  })
})
