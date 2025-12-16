import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'

import { SubmitPrimaryButton } from '..'

import type { ComponentProps } from 'react'

const mockOnClick = vi.fn()

const render = (props: ComponentProps<typeof SubmitPrimaryButton>) => {
  return renderWithProviders(<SubmitPrimaryButton {...props} />)[0]
}

describe('SubmitPrimaryButton', () => {
  let props: ComponentProps<typeof SubmitPrimaryButton>

  beforeEach(() => {
    props = {
      form: 'mockForm',
      value: 'submit primary button',
      onClick: mockOnClick,
      disabled: false,
    }
  })

  it('renders submit primary button with text - active', () => {
    render(props)
    const button = screen.getByText('submit primary button')
    expect(button).toHaveAttribute('form', 'mockForm')
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('renders secondary tertiary button with text and disabled', () => {
    props = {
      ...props,
      disabled: true,
    }
    render(props)
    const button = screen.getByText('submit primary button')
    expect(button).toBeDisabled()
  })

  it('calls mock function when clicking the button', () => {
    render(props)
    const button = screen.getByText('submit primary button')
    fireEvent.click(button)
    expect(props.onClick).toHaveBeenCalled()
  })
})
