import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { DeckConfigurator, renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { DeckFixtureSetupInstructionsModal } from '../../../organisms/DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'
import { DeckConfigurationEditor } from '..'

const mockPush = jest.fn()
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

jest.mock('@opentrons/components/src/hardware-sim/DeckConfigurator/index')
jest.mock(
  '../../../organisms/DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'
)

const mockDeckFixtureSetupInstructionsModal = DeckFixtureSetupInstructionsModal as jest.MockedFunction<
  typeof DeckFixtureSetupInstructionsModal
>
const mockDeckConfigurator = DeckConfigurator as jest.MockedFunction<
  typeof DeckConfigurator
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <DeckConfigurationEditor />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('DeckConfigurationEditor', () => {
  beforeEach(() => {
    mockDeckFixtureSetupInstructionsModal.mockReturnValue(
      <div>mock DeckFixtureSetupInstructionsModal</div>
    )
    mockDeckConfigurator.mockReturnValue(<div>mock DeckConfigurator</div>)
  })
  it('should render text, button and DeckConfigurator', () => {
    const [{ getByText }] = render()
    getByText('Deck configuration')
    getByText('Setup Instructions')
    getByText('Confirm')
    getByText('mock DeckConfigurator')
  })

  // it('should call a mock function when tapping the back button', () => {
  //   const [{ getAllByRole }] = render()
  //   const buttons = getAllByRole('button')
  //   // back button
  //   buttons[0].click()
  //   expect(mockPush).toHaveBeenCalled()
  // })

  it('should display setup instructions modal when tapping setup instructions button', () => {
    const [{ getByText }] = render()
    getByText('Setup Instructions').click()
    getByText('mock DeckFixtureSetupInstructionsModal')
  })
})
