import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { COLORS } from '../../../helix-design-system'
import { CURSOR_NOT_ALLOWED, CURSOR_POINTER } from '../../../styles/cursor'
import { renderWithProviders } from '../../../testing/utils'
import { TYPOGRAPHY } from '../../../ui-style-constants'
import { BasicButton } from '../BasicButton'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof BasicButton>) => {
  return renderWithProviders(<BasicButton {...props} />)
}

describe('BasicButton', () => {
  let props: ComponentProps<typeof BasicButton>

  beforeEach(() => {
    props = {
      children: 'basic button',
      onClick: vi.fn(),
      isDisabled: false,
      underLine: false,
    }
  })

  it('renders basic button with text', async () => {
    render(props)
    const button = screen.getByRole('button', { name: 'basic button' })
    expect(button).toHaveAttribute('aria-disabled', 'false')
    expect(button).toHaveStyle(`cursor: ${CURSOR_POINTER}`)
    expect(button).toHaveStyle(`color: ${COLORS.black90}`)
    expect(button).toHaveStyle(`text-decoration: none`)
  })

  // TODO: need to update '@testing-library/user-event' v14+
  // it('has hover styles when not disabled', async () => {
  //   render(props)
  //   const button = screen.getByRole('button', { name: 'basic button' })
  //   await userEvent.hover(button)
  //   expect(button).toHaveStyle(`color: ${COLORS.blue50}`)
  // })

  it('calls onClick when clicked', () => {
    render(props)
    const button = screen.getByRole('button', { name: 'basic button' })
    fireEvent.click(button)
    expect(props.onClick).toHaveBeenCalled()
  })

  it('renders basic button with text and aria-disabled', () => {
    props.isDisabled = true
    render(props)
    const button = screen.getByRole('button', { name: 'basic button' })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveStyle(`cursor: ${CURSOR_NOT_ALLOWED}`)
    expect(button).toHaveStyle(`color: ${COLORS.grey40}`)
  })

  it('renders basic button with text and underline', () => {
    props.underLine = true
    render(props)
    const button = screen.getByRole('button', { name: 'basic button' })
    expect(button).toHaveAttribute('aria-disabled', 'false')
    expect(button).toHaveStyle(`cursor: ${CURSOR_POINTER}`)
    expect(button).toHaveStyle(`color: ${COLORS.black90}`)
    expect(button).toHaveStyle(
      `text-decoration: ${TYPOGRAPHY.textDecorationUnderline}`
    )
  })

  it('has hover styles when not disabled', () => {
    render(props)
    const button = screen.getByRole('button', { name: 'basic button' })
    expect(button).toHaveStyle(`color: ${COLORS.black90}`)
    expect(button).toHaveAttribute('aria-disabled', 'false')
    expect(button).toHaveStyle(`cursor: ${CURSOR_POINTER}`)
  })
})
