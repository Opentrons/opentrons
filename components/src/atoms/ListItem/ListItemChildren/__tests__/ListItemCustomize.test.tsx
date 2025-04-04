import { vi, describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../testing/utils'
import { ListItemCustomize } from '../ListItemCustomize'

import type { ComponentProps } from 'react'

const MOCK_HEADER = 'Test Header'
const MOCK_LABEL = 'Test Label'
const MOCK_LEFT_ITEM_TEST_ID = 'left-item'
const MOCK_LEFT_ITEM_TEXT = 'Left Item'
const MOCK_TAG_TEXT = 'Test Tag'
const MOCK_LINK_TEXT = 'remove'

const render = (props: ComponentProps<typeof ListItemCustomize>) =>
  renderWithProviders(<ListItemCustomize {...props} />)

// Shortened realistic options needed for the test
const REALISTIC_OPTIONS = [
  {
    name: 'Opentrons 96 Well Aluminum Block',
    value: 'opentrons_96_well_aluminum_block',
  },
  {
    name: 'Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 μL',
    value: 'opentrons_96_aluminumblock_generic_pcr_strip_200ul',
  },
]

const MOCK_DROPDOWN_PROPS = {
  filterOptions: [
    { name: 'Option 1', value: 'option1' },
    { name: 'Option 2', value: 'option2' },
  ],
  onClick: vi.fn(),
  currentOption: { name: 'Option 1', value: 'option1' },
}

describe('ListItemCustomize', () => {
  it('renders header, label, and left item correctly', () => {
    render({
      header: MOCK_HEADER,
      label: MOCK_LABEL,
      leftHeaderItem: (
        <div data-testid={MOCK_LEFT_ITEM_TEST_ID}>{MOCK_LEFT_ITEM_TEXT}</div>
      ),
    })
    expect(screen.getByText(MOCK_HEADER)).toBeInTheDocument()
    expect(screen.getByText(MOCK_LABEL)).toBeInTheDocument()
    expect(screen.getByTestId(MOCK_LEFT_ITEM_TEST_ID)).toHaveTextContent(
      MOCK_LEFT_ITEM_TEXT
    )
  })

  it('renders with dropdown and displays current option', () => {
    render({
      header: MOCK_HEADER,
      dropdown: MOCK_DROPDOWN_PROPS,
    })
    expect(
      screen.getByText(MOCK_DROPDOWN_PROPS.currentOption.name)
    ).toBeInTheDocument()
  })

  it('renders with tag', () => {
    render({
      header: MOCK_HEADER,
      tag: { text: MOCK_TAG_TEXT, type: 'default' },
    })
    expect(screen.getByText(MOCK_TAG_TEXT)).toBeInTheDocument()
  })

  it('renders remove link, checks alignment, and calls onClick when clicked', () => {
    const onClickMock = vi.fn()
    render({
      header: MOCK_HEADER,
      linkText: MOCK_LINK_TEXT,
      onClick: onClickMock,
    })

    const removeLink = screen.getByRole('button', { name: MOCK_LINK_TEXT })
    expect(removeLink).toBeInTheDocument()
    // Test that the link has right alignment
    expect(removeLink).toHaveStyle('text-align: right')

    fireEvent.click(removeLink)
    expect(onClickMock).toHaveBeenCalled()
  })

  it('handles proper width ratios with both dropdown and remove link', () => {
    render({
      header: MOCK_HEADER,
      dropdown: MOCK_DROPDOWN_PROPS,
      label: MOCK_LABEL,
      linkText: MOCK_LINK_TEXT,
      onClick: vi.fn(), // Mock onClick for the link
    })

    expect(screen.getByText(MOCK_LABEL)).toBeInTheDocument()
    expect(
      screen.getByText(MOCK_DROPDOWN_PROPS.currentOption.name)
    ).toBeInTheDocument()

    const removeLink = screen.getByRole('button', { name: MOCK_LINK_TEXT })
    expect(removeLink).toBeInTheDocument()

    // Test the button width and alignment
    expect(removeLink).toHaveStyle('width: 12%')
    expect(removeLink).toHaveStyle('text-align: right')
  })

  it('renders realistic dropdown options, handles selection, and calls callback', () => {
    const mockDropdownClick = vi.fn()
    const realisticDropdownProps = {
      filterOptions: REALISTIC_OPTIONS,
      onClick: mockDropdownClick,
      currentOption: REALISTIC_OPTIONS[1], // Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 μL
    }

    render({
      header: 'Temperature Module GEN2',
      dropdown: realisticDropdownProps,
      label: 'Adapter',
      linkText: MOCK_LINK_TEXT,
      onClick: vi.fn(), // Mock onClick for the link
    })

    // Test that the dropdown shows the truncated selected option
    const initialOptionText = realisticDropdownProps.currentOption.name
    expect(screen.getByText(initialOptionText)).toBeInTheDocument()

    // Open the dropdown
    fireEvent.click(screen.getByText(initialOptionText))

    // Check another option is visible
    const optionToSelect = REALISTIC_OPTIONS[0] // Opentrons 96 Well Aluminum Block
    expect(screen.getByText(optionToSelect.name)).toBeInTheDocument()

    // Choose the different option
    fireEvent.click(screen.getByText(optionToSelect.name))

    // Verify the callback was called with correct value
    expect(mockDropdownClick).toHaveBeenCalledWith(optionToSelect.value)
  })
})
