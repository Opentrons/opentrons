import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../assets/localization'
import { LiquidButton } from '../../../../../components/molecules'
import { Configurations } from '../Configurations'
import { HardwareStep } from '../HardwareStep'

import type { ComponentProps } from 'react'

vi.mock('../HardwareStep')
vi.mock('../../../../../components/molecules')

const render = (props: ComponentProps<typeof Configurations>) => {
  return renderWithProviders(<Configurations {...props} />, {
    i18nInstance: i18n,
  })
}

const mockShowLiquidOverflowMenu = vi.fn()

describe('Configurations', () => {
  let props: ComponentProps<typeof Configurations>

  beforeEach(() => {
    props = {
      sidebarWidth: 235,
      showLiquidOverflowMenu: mockShowLiquidOverflowMenu,
    }
    vi.mocked(LiquidButton).mockReturnValue(<div>mock LiquidButton</div>)
    vi.mocked(HardwareStep).mockReturnValue(<div>mock HardwareStep</div>)
  })

  it('should render test and mock components', () => {
    render(props)
    screen.getByText('Configuration')
    screen.getByText('mock LiquidButton')
    screen.getByText('mock HardwareStep')
  })
})
