import { vi, describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../testing/utils'
import { ListItemCustomize } from '../ListItemCustomize'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof ListItemCustomize>) =>
  renderWithProviders(<ListItemCustomize {...props} />)

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
})
