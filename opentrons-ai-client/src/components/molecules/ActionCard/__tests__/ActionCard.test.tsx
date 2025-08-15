import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'

import { ActionCard } from '../index'

import type { ComponentProps } from 'react'

const mockOnClick = vi.fn()
const render = (props: ComponentProps<typeof ActionCard>) => {
  return renderWithProviders(<ActionCard {...props} />)
}

describe('ActionCard', () => {
  let props: ComponentProps<typeof ActionCard>

  beforeEach(() => {
    props = {
      titleKey: 'landing_page_update_title',
      descriptionKey: 'landing_page_update_description',
      linkKey: 'landing_page_update_link',
      onClick: mockOnClick,
    }
    vi.clearAllMocks()
  })

  it('should render an action card with translated content', () => {
    render(props)
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
    expect(screen.getByText('landing_page_update_title')).toBeInTheDocument()
    expect(
      screen.getByText('landing_page_update_description')
    ).toBeInTheDocument()
    expect(screen.getByText('landing_page_update_link')).toBeInTheDocument()
  })

  it('should render the navigation icon', () => {
    render(props)
    const icon = screen.getByTestId('ActionCard_Icon')
    expect(icon).toBeInTheDocument()
  })

  it('should call onClick when the link is clicked', () => {
    render(props)
    const link = screen.getByRole('link')
    fireEvent.click(link)
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should render with different props', () => {
    const differentProps = {
      titleKey: 'landing_page_create_title',
      descriptionKey: 'landing_page_create_description',
      linkKey: 'landing_page_create_link',
      onClick: mockOnClick,
    }
    render(differentProps)

    expect(screen.getByText('landing_page_create_title')).toBeInTheDocument()
    expect(
      screen.getByText('landing_page_create_description')
    ).toBeInTheDocument()
    expect(screen.getByText('landing_page_create_link')).toBeInTheDocument()
  })
})
