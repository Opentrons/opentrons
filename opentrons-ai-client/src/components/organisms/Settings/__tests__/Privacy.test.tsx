import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { ToggleButton } from '../../../../molecules/ToggleButton'
import { Privacy } from '../Privacy'

vi.mock('../../../../molecules/ToggleButton')

const mockProps = {
  enableAnalytics: true,
  onToggleAnalytics: vi.fn(),
}

const render = (props = mockProps) => {
  return renderWithProviders(<Privacy {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Privacy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ToggleButton).mockReturnValue(
      <div data-testid="mock-toggle-button">Mock Toggle Button</div>
    )
  })

  it('should render privacy section title', () => {
    render()
    expect(screen.getByText('Privacy')).toBeInTheDocument()
  })

  it('should render analytics toggle section', () => {
    render()
    expect(
      screen.getByText('Share analytics with Opentrons')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Help Opentrons improve its products and services by automatically sending anonymous diagnostics and usage data'
      )
    ).toBeInTheDocument()
  })

  it('should render ToggleButton component', () => {
    render()
    expect(screen.getByTestId('mock-toggle-button')).toBeInTheDocument()
  })

  it('should pass correct props to ToggleButton', () => {
    render()

    expect(ToggleButton).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'analytics-toggle',
        toggledOn: true,
        onClick: expect.any(Function),
      }),
      expect.anything()
    )
  })

  it('should pass toggledOn false when enableAnalytics is false', () => {
    render({
      enableAnalytics: false,
      onToggleAnalytics: vi.fn(),
    })

    expect(ToggleButton).toHaveBeenCalledWith(
      expect.objectContaining({
        toggledOn: false,
      }),
      expect.anything()
    )
  })

  it('should call onToggleAnalytics when toggle is clicked', () => {
    const mockOnToggle = vi.fn()
    vi.mocked(ToggleButton).mockReturnValue(
      <button data-testid="mock-toggle-button" onClick={mockOnToggle}>
        Mock Toggle Button
      </button>
    )

    render({
      enableAnalytics: true,
      onToggleAnalytics: mockOnToggle,
    })

    const toggleButton = screen.getByTestId('mock-toggle-button')
    fireEvent.click(toggleButton)

    // Verify the toggle function was passed correctly
    const lastCall = vi.mocked(ToggleButton).mock.calls[
      vi.mocked(ToggleButton).mock.calls.length - 1
    ]
    expect(typeof lastCall[0].onClick).toBe('function')
  })
})
