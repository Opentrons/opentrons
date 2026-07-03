import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StepGroup } from '..'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof StepGroup>) => {
  return renderWithProviders(<StepGroup {...props} />)
}

describe('StepGroup', () => {
  let props: ComponentProps<typeof StepGroup>

  beforeEach(() => {
    props = {
      title: 'mock title',
      isExpand: false,
      isActive: true,
      handleClick: vi.fn(),
      children: <>child</>,
    }
  })

  it('renders the title', () => {
    render(props)

    expect(screen.getByText('mock title')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render({ ...props, subtitle: 'mock subtitle' })

    expect(screen.getByText('mock subtitle')).toBeInTheDocument()
  })

  it('does not render subtitle when not provided', () => {
    render(props)

    expect(screen.queryByText('mock subtitle')).not.toBeInTheDocument()
  })

  it('calls handleClick when header is clicked', () => {
    render(props)

    fireEvent.click(screen.getByText('mock title'))

    expect(props.handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not render children when isExpand is false', () => {
    render({ ...props, isExpand: false })

    expect(screen.queryByText('child')).not.toBeInTheDocument()
  })

  it('renders children when isExpand is true', () => {
    render({ ...props, isExpand: true })

    expect(screen.getByText('child')).toBeInTheDocument()
  })

  it('does not trigger handleClick when clicking children (stopPropagation)', () => {
    render({ ...props, isExpand: true })

    fireEvent.click(screen.getByText('child'))

    expect(props.handleClick).not.toHaveBeenCalled()
  })

  it('does not trigger handleClick when clicking headerTrailing (stopPropagation)', () => {
    render({
      ...props,
      headerTrailing: <button type="button">trailing action</button>,
    })

    fireEvent.click(screen.getByRole('button', { name: 'trailing action' }))

    expect(props.handleClick).not.toHaveBeenCalled()
  })

  it('does not trigger handleClick when clicking headerLeading (stopPropagation)', () => {
    render({
      ...props,
      headerLeading: <button type="button">leading action</button>,
    })

    fireEvent.click(screen.getByRole('button', { name: 'leading action' }))

    expect(props.handleClick).not.toHaveBeenCalled()
  })

  it('does not trigger handleClick when clicking headerPrefixIcon (stopPropagation)', () => {
    render({
      ...props,
      headerPrefixIcon: <button type="button">prefix action</button>,
    })

    fireEvent.click(screen.getByRole('button', { name: 'prefix action' }))

    expect(props.handleClick).not.toHaveBeenCalled()
  })
})
