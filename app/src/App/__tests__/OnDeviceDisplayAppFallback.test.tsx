import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { appRestart } from '../../redux/shell'
import { OnDeviceDisplayAppFallback } from '../OnDeviceDisplayAppFallback'

jest.mock('../../redux/shell')

const mockAppRestart = appRestart as jest.MockedFunction<typeof appRestart>

const render = () => {
  return renderWithProviders(<OnDeviceDisplayAppFallback />)
}

describe('OnDeviceDisplayAppFallback', () => {
  it('should render text and button', () => {
    const [{ getByText }] = render()
    getByText('Restart the app')
    getByText('Something went wrong')
    getByText('Restart app')
  })

  it('should call a mock function when tapping reload button', () => {
    const [{ getByText }] = render()
    getByText('Restart app').click()
    expect(mockAppRestart).toHaveBeenCalled()
  })
})
