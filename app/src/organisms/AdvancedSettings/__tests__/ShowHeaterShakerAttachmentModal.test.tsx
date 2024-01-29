import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { getIsHeaterShakerAttached } from '../../../redux/config'
import { ShowHeaterShakerAttachmentModal } from '../ShowHeaterShakerAttachmentModal'

jest.mock('../../../redux/config')

const mockGetIsHeaterShakerAttached = getIsHeaterShakerAttached as jest.MockedFunction<
  typeof getIsHeaterShakerAttached
>

const render = () => {
  return renderWithProviders(<ShowHeaterShakerAttachmentModal />, {
    i18nInstance: i18n,
  })
}

describe('ShowHeaterShakerAttachmentModal', () => {
  it('renders the toggle button on when showing heater shaker modal as false', () => {
    mockGetIsHeaterShakerAttached.mockReturnValue(true)
    render()
    screen.getByText('Confirm Heater-Shaker Module Attachment')
    screen.getByText(
      'Display a reminder to attach the Heater-Shaker properly before running a test shake or using it in a protocol.'
    )
    const toggleButton = screen.getByRole('switch', {
      name: 'show_heater_shaker_modal',
    })
    expect(toggleButton.getAttribute('aria-checked')).toBe('false')
  })

  it('renders the toggle button on when showing heater shaker modal as true', () => {
    mockGetIsHeaterShakerAttached.mockReturnValue(false)
    render()
    const toggleButton = screen.getByRole('switch', {
      name: 'show_heater_shaker_modal',
    })
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })
})
