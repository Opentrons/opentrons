import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'
import { DeckConfigurator } from '@opentrons/components'

import { HardwareConfigurator } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { useDeckConfigurationEditing } from '../useDeckConfigurationEditing'

import type { ComponentProps } from 'react'
import type * as OpentronsComponents from '@opentrons/components'

vi.mock('../useDeckConfigurationEditing')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof OpentronsComponents>()
  return {
    ...actual,
    DeckConfigurator: vi.fn(),
  }
})

const render = (props: ComponentProps<typeof HardwareConfigurator>) => {
  return renderWithProviders(<HardwareConfigurator {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HardwareConfigurator', () => {
  let props: ComponentProps<typeof HardwareConfigurator>

  beforeEach(() => {
    props = {
      modules: {},
      hasGripper: false,
      fixtures: {},
    }
    vi.mocked(DeckConfigurator).mockReturnValue(
      <div>mock DeckConfigurator</div>
    )
    vi.mocked(useDeckConfigurationEditing).mockReturnValue({
      addFixtureModal: <div>mock modal</div>,
      addFixtureToCutout: vi.fn(),
      removeFixtureFromCutout: vi.fn(),
    })
  })

  it('should render the deck configurator and modal', () => {
    render(props)
    screen.getByText('mock DeckConfigurator')
    screen.getByText('mock modal')
  })
})
