import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { i18n } from '/app/i18n'
import { getIsHeaterShakerAttached, updateConfigValue } from '/app/redux/config'
import { renderWithProviders } from '/app/__testing-utils__'
import { ShowHeaterShakerAttachmentModal } from '../ShowHeaterShakerAttachmentModal'

vi.mock('/app/redux/config')

const render = () => {
  return renderWithProviders(<ShowHeaterShakerAttachmentModal />, {
    i18nInstance: i18n,
  })
}

describe('ShowHeaterShakerAttachmentModal', () => {
  beforeEach(() => {
    vi.mocked(getIsHeaterShakerAttached).mockReturnValue(true)
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
    vi.mocked(getIsHeaterShakerAttached).mockReturnValue(false)
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
    expect(vi.mocked(updateConfigValue)).toHaveBeenCalledWith(
      'modules.heaterShaker.isAttached',
      false
    )
  })
})
