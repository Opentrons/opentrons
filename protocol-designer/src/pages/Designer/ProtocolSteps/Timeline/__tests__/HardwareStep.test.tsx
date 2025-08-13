import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { START_TERMINAL_ITEM_ID } from '/protocol-designer/steplist'
import {
  getHoveredTerminalItemId,
  getSelectedTerminalItemId,
} from '/protocol-designer/ui/steps'
import { selectTerminalItem } from '/protocol-designer/ui/steps/actions/actions'

import { HardwareStep } from '../HardwareStep'

import type { ComponentProps } from 'react'

vi.mock('/protocol-designer/ui/steps')
vi.mock('/protocol-designer/ui/steps/actions/actions')
const render = (props: ComponentProps<typeof HardwareStep>) => {
  return renderWithProviders(<HardwareStep {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HardwareStep', () => {
  let props: ComponentProps<typeof HardwareStep>

  beforeEach(() => {
    props = {
      sidebarWidth: 190,
    }
    vi.mocked(getSelectedTerminalItemId).mockReturnValue(START_TERMINAL_ITEM_ID)
    vi.mocked(getHoveredTerminalItemId).mockReturnValue(null)
  })
  it('renders the button and copy for a flex/ot-2', () => {
    render(props)
    screen.getByText('Deck hardware')
    fireEvent.click(screen.getByText('Deck hardware'))
    expect(vi.mocked(selectTerminalItem)).toHaveBeenCalled()
  })
  it('renders the button and copy for a flex with small sidebar width', () => {
    props.sidebarWidth = 160
    render(props)
    expect(screen.queryByText('Deck hardware')).not.toBeInTheDocument()
  })
})
