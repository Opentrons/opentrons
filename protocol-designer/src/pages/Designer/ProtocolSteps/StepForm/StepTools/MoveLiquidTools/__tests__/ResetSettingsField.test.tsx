import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { ResetSettingsField } from '../ResetSettingsField'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof ResetSettingsField>) => {
  return renderWithProviders(<ResetSettingsField {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ResetSettingsField', () => {
  let props: ComponentProps<typeof ResetSettingsField>
  beforeEach(() => {
    props = {
      tab: 'aspirate',
      onClick: vi.fn(),
    }
  })

  it('should renders a reset aspirate button', async () => {
    const user = userEvent.setup()
    render(props)
    screen.getByText('Reset aspirate settings')
    const resetButton = screen.getByRole('button')
    expect(resetButton).toHaveStyle(`background-color: ${COLORS.transparent}`)
    await user.click(resetButton)
    expect(props.onClick).toHaveBeenCalled()
  })

  it('should renders a reset dispense button', async () => {
    const user = userEvent.setup()
    props.tab = 'dispense'
    render(props)
    screen.getByText('Reset dispense settings')
    const resetButton = screen.getByRole('button')
    expect(resetButton).toHaveStyle(`background-color: ${COLORS.transparent}`)
    await user.click(resetButton)
    expect(props.onClick).toHaveBeenCalled()
  })
})
