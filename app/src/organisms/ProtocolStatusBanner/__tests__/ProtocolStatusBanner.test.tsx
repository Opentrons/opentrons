import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { COLORS } from '@opentrons/components'

import { i18n } from '/app/i18n'
import { renderWithProviders } from '/app/__testing-utils__'
import { ProtocolStatusBanner } from '../index'

const render = () => {
  return renderWithProviders(<ProtocolStatusBanner />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolStatusBanner', () => {
  it('should render text and icon', () => {
    render()
    screen.getByText(
      'CSV file required for analysis. Add the CSV during run setup.'
    )
    screen.getByLabelText('icon_warning')
  })

  it('should render the banner with correct styling', () => {
    render()
    const icon = screen.getByLabelText('icon_warning')
    expect(icon).toHaveStyle(`color: ${COLORS.yellow60}`)
    expect(icon).toHaveStyle(`width: 1rem`)
    expect(icon).toHaveStyle(`height: 1rem`)
    const banner = screen.getByTestId('Banner_warning')
    expect(banner).toHaveStyle(`background-color: ${COLORS.yellow30}`)
  })
})
