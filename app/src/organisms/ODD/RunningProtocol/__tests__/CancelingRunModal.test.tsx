import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { CancelingRunModal } from '../CancelingRunModal'

const render = () => {
  return renderWithProviders(<CancelingRunModal />, {
    i18nInstance: i18n,
  })
}

describe('CancelingRunModal', () => {
  it('should render text and icon', () => {
    render()
    screen.getByText('Canceling run...')
    screen.getByLabelText('CancelingRunModal_icon')
  })
})
