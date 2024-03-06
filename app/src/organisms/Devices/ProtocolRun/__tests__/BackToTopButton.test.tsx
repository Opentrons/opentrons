import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { when, resetAllWhenMocks } from 'jest-when'
import { StaticRouter } from 'react-router-dom'
import { useRobot } from '../../hooks'
import { mockConnectableRobot } from '../../../../redux/discovery/__fixtures__'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
} from '../../../../redux/analytics'
import { BackToTopButton } from '../BackToTopButton'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    Tooltip: jest.fn(({ children }) => <div>{children}</div>),
  }
})
jest.mock('../../../../redux/analytics')
jest.mock('../../hooks')

const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>

const ROBOT_NAME = 'otie'
const RUN_ID = '1'
const ROBOT_SERIAL_NUMBER = 'OT123'

const render = () => {
  return renderWithProviders(
    <StaticRouter>
      <BackToTopButton
        protocolRunHeaderRef={null}
        robotName={ROBOT_NAME}
        runId={RUN_ID}
        sourceLocation="test run button"
      />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

let mockTrackEvent: jest.Mock

describe('BackToTopButton', () => {
  beforeEach(() => {
    mockTrackEvent = jest.fn()
    when(mockUseTrackEvent).calledWith().mockReturnValue(mockTrackEvent)
    when(mockUseRobot).mockReturnValue({
      ...mockConnectableRobot,
      health: {
        ...mockConnectableRobot.health,
        robot_serial: ROBOT_SERIAL_NUMBER,
      },
    })
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should be enabled with no tooltip if there are no missing Ids', () => {
    const { getByRole } = render()
    const button = getByRole('link', { name: 'Back to top' })
    expect(button).not.toBeDisabled()
    expect(button.getAttribute('href')).toEqual(
      '/devices/otie/protocol-runs/1/setup'
    )
  })

  it('should track a mixpanel event when clicked', () => {
    const { getByRole } = render()
    const button = getByRole('link', { name: 'Back to top' })
    fireEvent.click(button)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: {
        sourceLocation: 'test run button',
        robotSerialNumber: ROBOT_SERIAL_NUMBER,
      },
    })
  })

  it('should always be enabled', () => {
    const { getByRole } = render()
    const button = getByRole('button', { name: 'Back to top' })
    expect(button).not.toBeDisabled()
  })
})
