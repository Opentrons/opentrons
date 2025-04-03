import { vi, describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../testing/utils'
import { ListItemCustomize } from '../ListItemCustomize'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof ListItemCustomize>) =>
  renderWithProviders(<ListItemCustomize {...props} />)

// Real adapter options from the Temperature Module dropdown
const realAdapterOptions = [
  {
    name: 'Opentrons 24 Well Aluminum Block with Generic 2 mL Screwcap',
    value: 'opentrons_24_aluminumblock_generic_2ml_screwcap',
  },
  {
    name: 'Opentrons 96 Well Aluminum Block',
    value: 'opentrons_96_well_aluminum_block',
  },
  {
    name: 'Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 μL',
    value: 'opentrons_96_aluminumblock_generic_pcr_strip_200ul',
  },
  {
    name: 'Opentrons 24 Well Aluminum Block with NEST 1.5 mL Screwcap',
    value: 'opentrons_24_aluminumblock_nest_1.5ml_screwcap',
  },
  {
    name: 'Opentrons 24 Well Aluminum Block with NEST 1.5 mL Snapcap',
    value: 'opentrons_24_aluminumblock_nest_1.5ml_snapcap',
  },
  {
    name: 'Opentrons 24 Well Aluminum Block with NEST 2 mL Screwcap',
    value: 'opentrons_24_aluminumblock_nest_2ml_screwcap',
  },
  {
    name: 'Opentrons 24 Well Aluminum Block with NEST 2 mL Snapcap',
    value: 'opentrons_24_aluminumblock_nest_2ml_snapcap',
  },
  {
    name: 'Opentrons 24 Well Aluminum Block with NEST 0.5 mL Screwcap',
    value: 'opentrons_24_aluminumblock_nest_0.5ml_screwcap',
  },
  {
    name: 'Opentrons Aluminum Flat Bottom Plate',
    value: 'opentrons_aluminum_flat_bottom_plate',
  },
  {
    name: 'Opentrons 96 Deep Well Temperature Module Adapter',
    value: 'opentrons_96_deep_well_temp_mod_adapter',
  },
]

describe('ListItemCustomize', () => {
  it('renders with header', () => {
    render({ header: 'Test Header' })
    expect(screen.getByText('Test Header')).toBeInTheDocument()
  })

  it('renders with leftHeaderItem', () => {
    render({
      header: 'Test Header',
      leftHeaderItem: <div data-testid="left-item">Left Item</div>,
    })
    expect(screen.getByTestId('left-item')).toBeInTheDocument()
  })

  it('renders with label', () => {
    render({ header: 'Test Header', label: 'Test Label' })
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('renders with dropdown', () => {
    const dropdownProps = {
      filterOptions: [
        { name: 'Option 1', value: 'option1' },
        { name: 'Option 2', value: 'option2' },
      ],
      onClick: vi.fn(),
      currentOption: { name: 'Option 1', value: 'option1' },
    }

    render({
      header: 'Test Header',
      dropdown: dropdownProps,
    })

    expect(screen.getByText('Option 1')).toBeInTheDocument()
  })

  it('renders with tag', () => {
    render({
      header: 'Test Header',
      tag: { text: 'Test Tag', type: 'default' },
    })

    expect(screen.getByText('Test Tag')).toBeInTheDocument()
  })

  it('renders remove link and calls onClick when clicked', () => {
    const onClickMock = vi.fn()

    render({
      header: 'Test Header',
      linkText: 'remove',
      onClick: onClickMock,
    })

    const removeLink = screen.getByRole('button', { name: 'remove' })
    expect(removeLink).toBeInTheDocument()

    // Test that the link has right alignment
    expect(removeLink).toHaveStyle('text-align: right')

    fireEvent.click(removeLink)
    expect(onClickMock).toHaveBeenCalled()
  })

  it('handles proper width ratios with both dropdown and remove link', () => {
    const dropdownProps = {
      filterOptions: [
        { name: 'Option 1', value: 'option1' },
        { name: 'Option 2', value: 'option2' },
      ],
      onClick: vi.fn(),
      currentOption: { name: 'Option 1', value: 'option1' },
    }

    render({
      header: 'Test Header',
      dropdown: dropdownProps,
      label: 'Adapter',
      linkText: 'remove',
      onClick: vi.fn(),
    })

    expect(screen.getByText('Adapter')).toBeInTheDocument()
    expect(screen.getByText('Option 1')).toBeInTheDocument()

    const removeLink = screen.getByRole('button', { name: 'remove' })
    expect(removeLink).toBeInTheDocument()

    // Test the button width and alignment
    expect(removeLink).toHaveStyle('width: 11%')
    expect(removeLink).toHaveStyle('text-align: right')
  })

  it('renders realistic temperature module adapter options with very long names', () => {
    const dropdownProps = {
      filterOptions: realAdapterOptions,
      onClick: vi.fn(),
      currentOption: {
        name: 'Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 μL',
        value: 'opentrons_96_aluminumblock_generic_pcr_strip_200ul',
      },
    }

    render({
      header: 'Temperature Module GEN2',
      dropdown: dropdownProps,
      label: 'Adapter',
      linkText: 'remove',
      onClick: vi.fn(),
    })

    // Test that the dropdown shows the truncated selected option
    expect(
      screen.getByText(
        'Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 μL'
      )
    ).toBeInTheDocument()

    // Open the dropdown
    fireEvent.click(
      screen.getByText(
        'Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 μL'
      )
    )

    // Instead of checking all options (which may not all be visible due to virtualization),
    // check a few key options that should be visible initially
    expect(
      screen.getByText(
        'Opentrons 24 Well Aluminum Block with Generic 2 mL Screwcap'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText('Opentrons 96 Well Aluminum Block')
    ).toBeInTheDocument()

    // Choose a different option that should be visible
    fireEvent.click(screen.getByText('Opentrons 96 Well Aluminum Block'))

    // Verify the callback was called with correct value
    expect(dropdownProps.onClick).toHaveBeenCalledWith(
      'opentrons_96_well_aluminum_block'
    )
  })
})
