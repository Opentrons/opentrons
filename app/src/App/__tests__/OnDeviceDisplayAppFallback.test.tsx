import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../i18n'
import { appRestart } from '../../redux/shell'
import { OnDeviceDisplayAppFallback } from '../OnDeviceDisplayAppFallback'

import type { FallbackProps } from 'react-error-boundary'

jest.mock('../../redux/shell')

const mockError = {
  message: 'mock error',
} as Error
const mockAppRestart = appRestart as jest.MockedFunction<typeof appRestart>

const render = (props: FallbackProps) => {
  return renderWithProviders(<OnDeviceDisplayAppFallback {...props} />, {
    i18nInstance: i18n,
  })
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
    getByText('An unknown error has occurred')
    getByText(
      'You need to restart your robot. Then download the robot logs from the Opentrons App and send them to support@opentrons.com for assistance.'
    )
    getByText('Restart touchscreen')
  })

  it('should call a mock function when tapping reload button', () => {
    const [{ getByText }] = render(props)
    getByText('Restart touchscreen').click()
    expect(mockAppRestart).toHaveBeenCalled()
  })
})
