import { describe, beforeEach, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { DeckConfigurator } from '@opentrons/components'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { useDeckConfigurationEditing } from '../useDeckConfigurationEditing'
import { HardwareConfigurator } from '..'

import type { ComponentProps } from 'react'
import type * as OpentronsComponents from '@opentrons/components'
import type { WizardTileProps } from '../../../../pages/Onboarding/types'
import type { WizardFormState } from '../../types'

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

const values = {
  fixtures: {},
  hasGripper: false,
  fields: {
    name: '',
    description: '',
    organizationOrAuthor: '',
    robotType: FLEX_ROBOT_TYPE,
  },
  pipettesByMount: {
    left: {
      pipetteName: 'p50_single_flex',
      tiprackDefURI: ['opentrons/opentrons_flex_96_tiprack_200ul/1'],
    },
    right: {},
  },
  modules: {},
} as WizardFormState

const mockWizardTileProps: Partial<WizardTileProps> = {
  proceed: vi.fn(),
  setValue: vi.fn(),
  watch: vi.fn((name: keyof typeof values) => values[name]) as any,
}

describe('HardwareConfigurator', () => {
  let props: ComponentProps<typeof HardwareConfigurator>

  beforeEach(() => {
    props = {
      ...props,
      ...mockWizardTileProps,
    } as WizardTileProps
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
