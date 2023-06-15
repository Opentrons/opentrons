import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { OnDeviceDisplayAppFallback } from '../OnDeviceDisplayAppFallback'

const render = () => {
  return renderWithProviders(<OnDeviceDisplayAppFallback />)
}

describe('OnDeviceDisplayAppFallback', () => {
  it('should render text and button', () => {
    const [{ getByText }] = render()
    getByText('Something went wrong')
    getByText('Reload the app')
  })

  it('should call a mock function when tapping reload button', () => {
    const [{ getByText }] = render()
    getByText('Reload the app').click()
  })
})
