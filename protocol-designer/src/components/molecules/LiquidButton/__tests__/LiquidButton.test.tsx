import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { LiquidButton } from '..'

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
    screen.getByText('Liquids')
  })

  it('should call a mock function when clicking', async () => {
    const user = userEvent.setup()
    render(props)
    await user.click(screen.getByText('Liquids'))
    expect(mockShowLiquidOverflowMenu).toHaveBeenCalled()
  })
})
