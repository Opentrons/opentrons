import * as React from 'react'

import { renderWithProviders, COLORS } from '@opentrons/components'

import { SleepScreen } from '..'

const render = () => {
  return renderWithProviders(<SleepScreen />)
}

describe('SleepScreen', () => {
  it('should render empty screen', () => {
    const [{ getByTestId }] = render()
    const touchScreen = getByTestId('Touchscreen_SleepScreen')
    expect(touchScreen).toHaveStyle('width: 100vw')
    expect(touchScreen).toHaveStyle('height: 100vh')
    expect(touchScreen).toHaveStyle(`background-color: ${COLORS.black90}`)
  })
})
