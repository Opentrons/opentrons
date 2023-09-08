import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { ConfirmRobotName } from '../ConfirmRobotName'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'

import type { SetStatusBarCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/incidental'

const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

jest.mock('@opentrons/react-api-client')
jest.mock('@opentrons/shared-data/protocol/types/schemaV7/command/incidental')

const mockUseCreateLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>

const render = (props: React.ComponentProps<typeof ConfirmRobotName>) => {
  return renderWithProviders(
    <MemoryRouter>
      <ConfirmRobotName {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ConfirmRobotName', () => {
  let props: React.ComponentProps<typeof ConfirmRobotName>
  let mockCreateLiveCommand = jest.fn()
  beforeEach(() => {
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    props = {
      robotName: 'otie',
    }
    mockUseCreateLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
  })

  it('should render text, an image and a button', () => {
    const [{ getByText }] = render(props)
    getByText('otie, love it!')
    getByText('Your robot is ready to go.')
    getByText('Finish setup')
  })

  it('when tapping a button, call a mock function', () => {
    const [{ getByText }] = render(props)
    const button = getByText('Finish setup')
    const animationCommand: SetStatusBarCreateCommand = {
      commandType: 'setStatusBar',
      params: { animation: 'disco' },
    }
    button.click()
    expect(mockPush).toBeCalledWith('/dashboard')
    expect(mockUseCreateLiveCommandMutation).toBeCalledWith()
    expect(mockCreateLiveCommand).toBeCalledWith({
      command: animationCommand,
      waitUntilComplete: false,
    })
  })
})
