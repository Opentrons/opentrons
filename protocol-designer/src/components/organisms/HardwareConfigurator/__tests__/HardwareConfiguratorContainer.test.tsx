import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { DeckConfigurator } from '@opentrons/components'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { HardwareConfiguratorContainer } from '../HardwareConfiguratorContainer'
import { useDeckConfigurationEditing } from '../utils'

import type { ComponentProps } from 'react'
import type * as OpentronsComponents from '@opentrons/components'

vi.mock('../utils')
vi.mock('/protocol-designer/step-forms/actions')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof OpentronsComponents>()
  return {
    ...actual,
    DeckConfigurator: vi.fn(),
  }
})
vi.mock('/protocol-designer/feature-flags/selectors')

const render = (
  props: ComponentProps<typeof HardwareConfiguratorContainer>
) => {
  return renderWithProviders(<HardwareConfiguratorContainer {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HardwareConfiguratorContainer', () => {
  let props: ComponentProps<typeof HardwareConfiguratorContainer>

  beforeEach(() => {
    props = {
      modules: {},
      hasGripper: false,
      fixtures: {},
      deckConfig: [],
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
