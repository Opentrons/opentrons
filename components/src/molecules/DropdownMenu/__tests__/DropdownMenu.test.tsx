import { screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { renderWithProviders } from '../../../testing/utils'
import { DropdownMenu } from '..'

import type { ComponentProps } from 'react'
import type { DropdownOption } from '..'

const mockOptions: DropdownOption[] = [
  { name: 'Option 1', value: 'option1' },
  { name: 'Option 2', value: 'option2' },
  { name: 'Option 3', value: 'option3' },
  {
    name: 'Option with a very long name that would normally be truncated',
    value: 'option4',
  },
]

const mockOnClick = vi.fn()

describe('DropdownMenu', () => {
  let props: ComponentProps<typeof DropdownMenu>

  beforeEach(() => {
    vi.resetAllMocks()
    props = {
      filterOptions: mockOptions,
      onClick: mockOnClick,
      currentOption: mockOptions[0],
    }
  })

  it('renders with default props', () => {
    renderWithProviders(<DropdownMenu {...props} />)
    expect(screen.getByText('Option 1')).toBeInTheDocument()
  })

  it('renders with custom props', () => {
    props = {
      filterOptions: mockOptions,
      onClick: mockOnClick,
      currentOption: mockOptions[0],
      dropdownType: 'neutral',
      title: 'Custom Dropdown',
      caption: 'Select an option',
      tooltipText: 'This is a tooltip',
    }
    renderWithProviders(<DropdownMenu {...props} />)

    expect(screen.getByText('Custom Dropdown')).toBeInTheDocument()
    expect(screen.getByText('Select an option')).toBeInTheDocument()
    expect(screen.getByText('Option 1')).toBeInTheDocument()
  })

  it('renders default, opens, displays options (including long text), and handles selection', () => {
    renderWithProviders(<DropdownMenu {...props} />)
    const trigger = screen.getByText('Option 1')
    expect(trigger).toBeInTheDocument()

    // Click to open dropdown
    fireEvent.click(trigger)

    // Assert multiple options are present
    expect(screen.getByText('Option 2')).toBeInTheDocument()
    expect(screen.getByText('Option 3')).toBeInTheDocument()

    // Find the long option text element
    const longOption = screen.getByText(
      'Option with a very long name that would normally be truncated'
    )
    expect(longOption).toBeInTheDocument()

    // Test the style
    expect(longOption).toHaveStyle('white-space: wrap')

    // Click the long option to test selection
    fireEvent.click(longOption)

    // Verify correct option was clicked
    expect(mockOnClick).toHaveBeenCalledWith('option4')
  })

  it('calls onClick when an option is selected', () => {
    renderWithProviders(<DropdownMenu {...props} />)
    fireEvent.click(screen.getByText('Option 1'))
    fireEvent.click(screen.getByText('Option 2'))

    expect(mockOnClick).toHaveBeenCalledWith('option2')
  })

  it('has flexible height to accommodate longer text content', () => {
    // Use a long option as the current option
    props.currentOption = mockOptions[3]

    renderWithProviders(<DropdownMenu {...props} />)

    // Get the dropdown container using data-testid
    const dropdownContainer = screen.getByTestId('dropdown-container')

    // Check that it has the correct height styles
    expect(dropdownContainer).toHaveStyle({
      'min-height': '2.25rem',
      height: 'auto',
    })
  })

  it('applies whiteSpace: wrap style to option text in dropdown', () => {
    renderWithProviders(<DropdownMenu {...props} />)

    // Open the dropdown
    fireEvent.click(screen.getByText('Option 1'))

    // Directly test the style on line 335 by getting the long option text
    const longOption = screen.getByText(
      'Option with a very long name that would normally be truncated'
    )

    // Verify that it has the white-space: wrap style
    expect(longOption).toHaveStyle('white-space: wrap')
  })

  // Specifically target line 335: style={{ whiteSpace: 'wrap' }}
  it('applies whiteSpace: wrap style to option text', () => {
    renderWithProviders(<DropdownMenu {...props} />)

    // Open the dropdown
    fireEvent.click(screen.getByText('Option 1'))

    // Wait for dropdown options to appear
    const optionTexts = screen.getAllByTestId('dropdown-option-text')

    // Each option text should have the white-space: wrap style
    optionTexts.forEach(optionText => {
      // The inline style property we're testing in line 335
      expect(optionText).toHaveStyle('white-space: wrap')
    })
  })

  // ToDo (kk:08/13/2024) activate when jsdom is updated
  //   it('renders tooltip when tooltipText is provided', () => {
  //     props = {
  //       filterOptions: mockOptions,
  //       onClick: mockOnClick,
  //       currentOption: mockOptions[0],
  //       title: 'With Tooltip',
  //       tooltipText: 'Tooltip content',
  //     }
  //     render(props)

  //     expect(screen.getByText('With Tooltip')).toBeInTheDocument()
  //     const infoIcon = screen.getByTestId('information_icon')
  //     fireEvent.mouseOver(infoIcon)
  //     expect(screen.getByText('Tooltip content')).toBeInTheDocument()
  //   })
})
