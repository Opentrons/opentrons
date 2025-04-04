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

const render = (props: ComponentProps<typeof DropdownMenu>) => {
  return renderWithProviders(<DropdownMenu {...props} />)
}

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
    render(props)
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
    render(props)

    expect(screen.getByText('Custom Dropdown')).toBeInTheDocument()
    expect(screen.getByText('Select an option')).toBeInTheDocument()
    expect(screen.getByText('Option 1')).toBeInTheDocument()
  })

  it('renders default, opens, displays options (including long text), and handles selection', () => {
    render(props)
    const trigger = screen.getByText('Option 1')
    expect(trigger).toBeInTheDocument()

    // Click to open dropdown
    fireEvent.click(trigger)

    // --- Assert multiple options are present (implies container at line 297 rendered) ---
    expect(screen.getByText('Option 2')).toBeInTheDocument()
    expect(screen.getByText('Option 3')).toBeInTheDocument()

    // --- Assert long option text is present and check its style (covers line 334) ---
    const longOption = screen.getByText(
      'Option with a very long name that would normally be truncated'
    )
    expect(longOption).toBeInTheDocument()
    // Explicitly check the style applied by line 334
    expect(longOption).toHaveStyle({ whiteSpace: 'nowrap' })

    // Click the long option to test selection and interaction with styled element
    fireEvent.click(longOption)

    // Verify correct option was clicked
    expect(mockOnClick).toHaveBeenCalledWith('option4')
  })

  it('calls onClick when an option is selected', () => {
    render(props)
    fireEvent.click(screen.getByText('Option 1'))
    fireEvent.click(screen.getByText('Option 2'))

    expect(mockOnClick).toHaveBeenCalledWith('option2')
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
