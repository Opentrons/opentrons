import * as React from 'react'

import { renderWithProviders, DeckConfigurator } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ProtocolSetupDeckConfiguration } from '..'

jest.mock('@opentrons/components/src/hardware-sim/DeckConfigurator/index')

const mockSetSetupScreen = jest.fn()

const mockDeckConfigurator = DeckConfigurator as jest.MockedFunction<
  typeof DeckConfigurator
>

const render = (
  props: React.ComponentProps<typeof ProtocolSetupDeckConfiguration>
) => {
  return renderWithProviders(<ProtocolSetupDeckConfiguration {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolSetupDeckConfiguration', () => {
  let props: React.ComponentProps<typeof ProtocolSetupDeckConfiguration>

  beforeEach(() => {
    props = {
      setSetupScreen: mockSetSetupScreen,
    }
    mockDeckConfigurator.mockReturnValue(<div>mock DeckConfigurator</div>)
  })

  it('should render text, button, and DeckConfigurator', () => {
    const [{ getByText }] = render(props)
    getByText('Deck configuration')
    getByText('mock DeckConfigurator')
  })

  it('should call a mock function when tapping the back button', () => {})
})
