import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { getDeckConfiguration } from '../../../../step-forms/selectors'
import { HardwareConfiguratorContainer } from '../HardwareConfiguratorContainer'
import { HardwareConfigurator } from '..'

import type { ComponentProps } from 'react'
import type * as OpentronsComponents from '@opentrons/components'

vi.mock('../HardwareConfiguratorContainer')
vi.mock('../../../../step-forms/actions')
vi.mock('../../../../step-forms/selectors')
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
    vi.mocked(getDeckConfiguration).mockReturnValue({ deckConfig: [] })
    vi.mocked(HardwareConfiguratorContainer).mockReturnValue(
      <div>mock HardwareConfiguratorContainer</div>
    )
  })

  it('should render the HardwareConfiguratorContainer', () => {
    render(props)
    screen.getByText('mock HardwareConfiguratorContainer')
  })
})
