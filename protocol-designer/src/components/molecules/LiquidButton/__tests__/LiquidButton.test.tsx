import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LiquidButton } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'

import type { ComponentProps } from 'react'

const mockShowLiquidOverflowMenu = vi.fn()

const render = (props: ComponentProps<typeof LiquidButton>) => {
  return renderWithProviders(<LiquidButton {...props} />, {
    i18nInstance: i18n,
  })
}

describe('LiquidButton', () => {
  let props: ComponentProps<typeof LiquidButton>

  beforeEach(() => {
    props = {
      showLiquidOverflowMenu: mockShowLiquidOverflowMenu,
    }
  })

  it('should render icon and text', () => {
    render(props)
    screen.getByTestId('water-drop')
    screen.getByText('Liquids')
  })

  it('should call a mock function when clicking', () => {
    render(props)
    fireEvent.click(screen.getByText('Liquids'))
    expect(mockShowLiquidOverflowMenu).toHaveBeenCalled()
  })
})
