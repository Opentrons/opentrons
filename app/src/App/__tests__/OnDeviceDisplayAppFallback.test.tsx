import * as React from 'react'
import { when } from 'jest-when'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../i18n'
import { appRestart } from '../../redux/shell'
import { useTrackEvent, ANALYTICS_ODD_APP_ERROR } from '../../redux/analytics'
import { OnDeviceDisplayAppFallback } from '../OnDeviceDisplayAppFallback'

import type { FallbackProps } from 'react-error-boundary'

jest.mock('../../redux/shell')
jest.mock('../../redux/analytics')

const mockError = {
  message: 'mock error',
} as Error
const mockAppRestart = appRestart as jest.MockedFunction<typeof appRestart>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>

const render = (props: FallbackProps) => {
  return renderWithProviders(<OnDeviceDisplayAppFallback {...props} />, {
    i18nInstance: i18n,
  })
}

let mockTrackEvent: jest.Mock

describe('OnDeviceDisplayAppFallback', () => {
  let props: FallbackProps

  beforeEach(() => {
    props = {
      error: mockError,
      resetErrorBoundary: {} as any,
    } as FallbackProps
    mockTrackEvent = jest.fn()
    when(mockUseTrackEvent).calledWith().mockReturnValue(mockTrackEvent)
  })

  it('should render text and button', () => {
    render(props)
    screen.getByText('An unknown error has occurred')
    screen.getByText(
      'You need to restart the touchscreen. Then download the robot logs from the Opentrons App and send them to support@opentrons.com for assistance.'
    )
    screen.getByText('Restart touchscreen')
  })

  it('should call a mock function when tapping reload button', () => {
    render(props)
    fireEvent.click(screen.getByText('Restart touchscreen'))
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_ODD_APP_ERROR,
      properties: { errorMessage: 'mock error' },
    })
    expect(mockAppRestart).toHaveBeenCalled()
  })
})
