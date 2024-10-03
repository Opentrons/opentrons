import * as React from 'react'
import { vi, it, describe, expect, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { updateConfigValue } from '../../../redux/config'
import { WelcomeModal } from '../WelcomeModal'

import type { SetStatusBarCreateCommand } from '@opentrons/shared-data'

vi.mock('@opentrons/react-api-client')
vi.mock('../../../redux/config')

const mockFunc = vi.fn()
const WELCOME_MODAL_IMAGE_NAME = 'welcome_dashboard_modal.png'

const render = (props: React.ComponentProps<typeof WelcomeModal>) => {
  return renderWithProviders(<WelcomeModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('WelcomeModal', () => {
  let props: React.ComponentProps<typeof WelcomeModal>
  let mockCreateLiveCommand = vi.fn()

  beforeEach(() => {
    mockCreateLiveCommand = vi.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    props = {
      setShowWelcomeModal: mockFunc,
    }
    vi.mocked(useCreateLiveCommandMutation).mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
  })

  it('should render text and button', () => {
    render(props)
    const image = screen.getByRole('img')
    const animationCommand: SetStatusBarCreateCommand = {
      commandType: 'setStatusBar',
      params: { animation: 'disco' },
    }

    expect(image.getAttribute('src')).toContain(WELCOME_MODAL_IMAGE_NAME)
    screen.getByText('Welcome to your dashboard!')
    screen.getByText(
      'A place to run protocols, manage your instruments, and view robot status.'
    )
    screen.getByText('Next')
    expect(vi.mocked(useCreateLiveCommandMutation)).toBeCalledWith()
    expect(mockCreateLiveCommand).toBeCalledWith({
      command: animationCommand,
      waitUntilComplete: false,
    })
  })

  it('should call a mock function when tapping next button', () => {
    render(props)
    fireEvent.click(screen.getByText('Next'))
    expect(vi.mocked(updateConfigValue)).toHaveBeenCalledWith(
      'onDeviceDisplaySettings.unfinishedUnboxingFlowRoute',
      null
    )
    expect(props.setShowWelcomeModal).toHaveBeenCalled()
  })
})
