import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useRestartRobotMutation } from '/app/resources/devices/hooks/useRestartRobotMutation'

import { RestartRobotConfirmationModal } from '../RestartRobotConfirmationModal'

import type { ComponentProps } from 'react'

vi.mock('/app/resources/devices/hooks/useRestartRobotMutation')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const mockFunc = vi.fn()
const mockRestart = vi.fn()

const render = (
  props: ComponentProps<typeof RestartRobotConfirmationModal>
) => {
  return renderWithProviders(<RestartRobotConfirmationModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RestartRobotConfirmationModal', () => {
  let props: ComponentProps<typeof RestartRobotConfirmationModal>

  beforeEach(() => {
    props = {
      robotName: 'mockRobotName',
      setShowRestartRobotConfirmationModal: mockFunc,
    }
    mockRestart.mockReset()
    vi.mocked(useRestartRobotMutation).mockReturnValue({
      restart: mockRestart,
    } as any)
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Restart now?')
    screen.getByTestId('restart_robot_confirmation_description')
    screen.getByText('Go back')
    screen.getByText('Restart')
  })

  it('should call a mock function when tapping go back button', () => {
    render(props)
    fireEvent.click(screen.getByText('Go back'))
    expect(mockFunc).toHaveBeenCalled()
  })

  it('should call mock restart function when tapping restart', () => {
    render(props)
    fireEvent.click(screen.getByText('Restart'))
    expect(mockRestart).toHaveBeenCalled()
  })
})
