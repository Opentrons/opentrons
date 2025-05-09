import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../assets/localization'
import {
  getHoveredTerminalItemId,
  getSelectedTerminalItemId,
} from '../../../../../ui/steps'
import { selectTerminalItem } from '../../../../../ui/steps/actions/actions'
import { LiquidStep } from '../LiquidStep'

import type { ComponentProps } from 'react'

vi.mock('../../../../../ui/steps')
vi.mock('../../../../../file-data/selectors')
vi.mock('../../../../../ui/steps/actions/actions')
const render = (props: ComponentProps<typeof LiquidStep>) => {
  return renderWithProviders(<LiquidStep {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LiquidStep', () => {
  let props: ComponentProps<typeof LiquidStep>

  beforeEach(() => {
    props = {
      sidebarWidth: 190,
    }
    vi.mocked(getSelectedTerminalItemId).mockReturnValue(null)
    vi.mocked(getHoveredTerminalItemId).mockReturnValue(null)
  })
  it('renders the button and text', () => {
    render(props)
    expect(screen.getByText('Liquids')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Liquids'))
    expect(vi.mocked(selectTerminalItem)).toHaveBeenCalled()
  })

  it('renders the button and copy for a flex with small sidebar width', () => {
    props.sidebarWidth = 160
    render(props)
    expect(screen.queryByText('Liquids')).not.toBeInTheDocument()
  })
})
