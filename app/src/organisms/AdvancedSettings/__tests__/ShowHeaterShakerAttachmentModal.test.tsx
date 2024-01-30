import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import {
  getIsHeaterShakerAttached,
  updateConfigValue,
} from '../../../redux/config'
import { ShowHeaterShakerAttachmentModal } from '../ShowHeaterShakerAttachmentModal'

jest.mock('../../../redux/config')

const mockGetIsHeaterShakerAttached = getIsHeaterShakerAttached as jest.MockedFunction<
  typeof getIsHeaterShakerAttached
>
const mockUpdateConfigValue = updateConfigValue as jest.MockedFunction<
  typeof updateConfigValue
>

const render = () => {
  return renderWithProviders(<ShowHeaterShakerAttachmentModal />, {
    i18nInstance: i18n,
  })
}

describe('ShowHeaterShakerAttachmentModal', () => {
  beforeEach(() => {
    mockGetIsHeaterShakerAttached.mockReturnValue(true)
  })

  it('renders the toggle button on when showing heater shaker modal as false', () => {
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

  it('should call mock function when clicking toggle button', () => {
    render()
    const toggleButton = screen.getByRole('switch', {
      name: 'show_heater_shaker_modal',
    })
    fireEvent.click(toggleButton)
    expect(mockUpdateConfigValue).toHaveBeenCalledWith(
      'modules.heaterShaker.isAttached',
      false
    )
  })
})
