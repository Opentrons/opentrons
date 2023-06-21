import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { appRestart } from '../../redux/shell'
import { OnDeviceDisplayAppFallback } from '../OnDeviceDisplayAppFallback'

import type { FallbackProps } from 'react-error-boundary'

jest.mock('../../redux/shell')

const mockError = {
  message: 'mock error',
} as Error
const mockAppRestart = appRestart as jest.MockedFunction<typeof appRestart>

const render = (props: FallbackProps) => {
  return renderWithProviders(<OnDeviceDisplayAppFallback {...props} />)
}

describe('OnDeviceDisplayAppFallback', () => {
  let props: FallbackProps

  beforeEach(() => {
    props = {
      error: mockError,
      resetErrorBoundary: {} as any,
    } as FallbackProps
  })

  it('should render text and button', () => {
    const [{ getByText }] = render(props)
    getByText('Restart the app')
    getByText('Something went wrong')
    getByText('mock error')
    getByText('Restart app')
  })

  it('should call a mock function when tapping reload button', () => {
    const [{ getByText }] = render(props)
    getByText('Restart app').click()
    expect(mockAppRestart).toHaveBeenCalled()
  })
})
