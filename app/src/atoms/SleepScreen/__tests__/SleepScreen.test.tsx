import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { COLORS } from '@opentrons/components'
import { renderWithProviders } from '/app/__testing-utils__'

import { SleepScreen } from '..'

const render = () => {
  return renderWithProviders(<SleepScreen />)
}

describe('SleepScreen', () => {
  it('should render empty screen', () => {
    render()
    const touchScreen = screen.getByTestId('Touchscreen_SleepScreen')
    expect(touchScreen).toHaveStyle('width: 100vw')
    expect(touchScreen).toHaveStyle('height: 100vh')
    expect(touchScreen).toHaveStyle(`background-color: ${COLORS.black90}`)
  })
})
