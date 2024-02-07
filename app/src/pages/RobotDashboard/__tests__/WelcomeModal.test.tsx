import * as React from 'react'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { WelcomeModal } from '../WelcomeModal'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'

import type { SetStatusBarCreateCommand } from '@opentrons/shared-data'

jest.mock('../../../redux/config')
jest.mock('@opentrons/react-api-client')

const mockUseCreateLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>

const mockFunc = jest.fn()
const WELCOME_MODAL_IMAGE_NAME = 'welcome_dashboard_modal.png'

const render = (props: React.ComponentProps<typeof WelcomeModal>) => {
  return renderWithProviders(<WelcomeModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('WelcomeModal', () => {
  let props: React.ComponentProps<typeof WelcomeModal>
  let mockCreateLiveCommand = jest.fn()

  beforeEach(() => {
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    props = {
      setShowWelcomeModal: mockFunc,
    }
    mockUseCreateLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
  })

  it('should render text and button', () => {
    const [{ getByText, getByRole }] = render(props)
    const image = getByRole('img')
    const animationCommand: SetStatusBarCreateCommand = {
      commandType: 'setStatusBar',
      params: { animation: 'disco' },
    }

    expect(image.getAttribute('src')).toEqual(WELCOME_MODAL_IMAGE_NAME)
    getByText('Welcome to your dashboard!')
    getByText(
      'A place to run protocols, manage your instruments, and view robot status.'
    )
    getByText('Next')
    expect(mockUseCreateLiveCommandMutation).toBeCalledWith()
    expect(mockCreateLiveCommand).toBeCalledWith({
      command: animationCommand,
      waitUntilComplete: false,
    })
  })

  it('should call a mock function when tapping next button', () => {
    const [{ getByText }] = render(props)
    fireEvent.click(getByText('Next'))
    expect(props.setShowWelcomeModal).toHaveBeenCalled()
  })
})
