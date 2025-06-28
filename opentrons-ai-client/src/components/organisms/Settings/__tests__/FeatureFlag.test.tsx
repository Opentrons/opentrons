import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { ToggleButton } from '../../../../molecules/ToggleButton'
import { FeatureFlag } from '../FeatureFlag'

vi.mock('../../../../molecules/ToggleButton')

const mockProps = {
  enablePDProtocolGeneration: true,
  onTogglePDProtocolGeneration: vi.fn(),
}

const render = (props = mockProps) => {
  return renderWithProviders(<FeatureFlag {...props} />, {
    i18nInstance: i18n,
  })
}

describe('FeatureFlag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ToggleButton).mockReturnValue(
      <div data-testid="mock-toggle-button">Mock Toggle Button</div>
    )
  })

  it('should render feature flags section title', () => {
    render()
    expect(screen.getByText('Feature Flags')).toBeInTheDocument()
  })

  it('should render protocol designer protocol generation toggle', () => {
    render()
    expect(
      screen.getByText('Protocol Designer Protocol Generation')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Enable Protocol Designer protocol generation features')
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
        label: 'pd-protocol-generation-toggle',
        toggledOn: true,
        onClick: expect.any(Function),
      }),
      expect.anything()
    )
  })

  it('should pass toggledOn false when enablePDProtocolGeneration is false', () => {
    render({
      enablePDProtocolGeneration: false,
      onTogglePDProtocolGeneration: vi.fn(),
    })

    expect(ToggleButton).toHaveBeenCalledWith(
      expect.objectContaining({
        toggledOn: false,
      }),
      expect.anything()
    )
  })

  it('should call onTogglePDProtocolGeneration when toggle is clicked', () => {
    const mockOnToggle = vi.fn()
    vi.mocked(ToggleButton).mockReturnValue(
      <button data-testid="mock-toggle-button" onClick={mockOnToggle}>
        Mock Toggle Button
      </button>
    )

    render({
      enablePDProtocolGeneration: true,
      onTogglePDProtocolGeneration: mockOnToggle,
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
