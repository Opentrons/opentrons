import * as React from 'react'
import { expect, vi, it, describe, beforeEach } from 'vitest'
import { when } from 'vitest-when'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '../../__testing-utils__'
import { i18n } from '../../i18n'
import { appRestart } from '../../redux/shell'
import { useTrackEvent, ANALYTICS_ODD_APP_ERROR } from '../../redux/analytics'
import { OnDeviceDisplayAppFallback } from '../OnDeviceDisplayAppFallback'

import type { Mock } from 'vitest'
import type { FallbackProps } from 'react-error-boundary'

vi.mock('../../redux/shell')
vi.mock('../../redux/analytics')

const mockError = {
  message: 'mock error',
} as Error

const render = (props: FallbackProps) => {
  return renderWithProviders(<OnDeviceDisplayAppFallback {...props} />, {
    i18nInstance: i18n,
  })
}

describe('OnDeviceDisplayAppFallback', () => {
  let props: FallbackProps
  let mockTrackEvent: Mock

  beforeEach(() => {
    props = {
      error: mockError,
      resetErrorBoundary: {} as any,
    } as FallbackProps
    mockTrackEvent = vi.fn()
    when(vi.mocked(useTrackEvent)).calledWith().thenReturn(mockTrackEvent)
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
    expect(vi.mocked(appRestart)).toHaveBeenCalled()
  })
})
