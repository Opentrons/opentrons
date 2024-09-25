import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { NoQuickTransfers } from '../NoQuickTransfers'
import { screen } from '@testing-library/react'

const render = () => {
  return renderWithProviders(<NoQuickTransfers />, { i18nInstance: i18n })
}

const NO_TRANSFERS_PNG_FILE_NAME =
  '/app/src/assets/images/on-device-display/empty_quick_transfer_dashboard.png'

describe('NoQuickTransfers', () => {
  it('should render text and image', () => {
    render()
    screen.getByText('No quick transfers to show!')
    screen.getByText('Create a new quick transfer to get started.')
    const image = screen.getByRole('img')
    expect(image.getAttribute('src')).toEqual(NO_TRANSFERS_PNG_FILE_NAME)
  })
})
