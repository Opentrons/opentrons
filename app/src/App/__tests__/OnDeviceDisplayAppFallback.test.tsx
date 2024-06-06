import * as React from 'react'
import { vi, describe, beforeEach, it, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../__testing-utils__'

import { getLocalRobot } from '../../redux/discovery'
import { mockConnectableRobot } from '../../redux/discovery/__fixtures__'
import { i18n } from '../../i18n'
import { appRestart } from '../../redux/shell'
import { useTrackEvent, ANALYTICS_ODD_APP_ERROR } from '../../redux/analytics'
import { OnDeviceDisplayAppFallback } from '../OnDeviceDisplayAppFallback'

import type { FallbackProps } from 'react-error-boundary'
import type { Mock } from 'vitest'

vi.mock('../../redux/shell')
vi.mock('../../redux/analytics')
vi.mock('../../redux/discovery', async importOriginal => {
  const actual = await importOriginal<typeof getLocalRobot>()
  return {
    ...actual,
    getLocalRobot: vi.fn(),
  }
})

const mockError = {
  message: 'mock error',
} as Error

const render = (props: FallbackProps) => {
  return renderWithProviders(<OnDeviceDisplayAppFallback {...props} />, {
    i18nInstance: i18n,
  })
}

let mockTrackEvent: Mock

const MOCK_ROBOT_SERIAL_NUMBER = 'OT123'

describe('OnDeviceDisplayAppFallback', () => {
  let props: FallbackProps

  beforeEach(() => {
    props = {
      error: mockError,
      resetErrorBoundary: {} as any,
    } as FallbackProps
    mockTrackEvent = vi.fn()
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
    vi.mocked(getLocalRobot).mockReturnValue({
      ...mockConnectableRobot,
      health: {
        ...mockConnectableRobot.health,
        robot_serial: MOCK_ROBOT_SERIAL_NUMBER,
      },
    })
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
      properties: {
        errorMessage: 'mock error',
        robotSerialNumber: MOCK_ROBOT_SERIAL_NUMBER,
      },
    })
    expect(vi.mocked(appRestart)).toHaveBeenCalled()
  })
})
