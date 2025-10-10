import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '../../../testing/utils'
import { Button } from '../Button'
import styles from '../button.module.css'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof Button>) => {
  return renderWithProviders(<Button {...props} />)[0]
}

describe('Button', () => {
  let props: ComponentProps<typeof Button>

  beforeEach(() => {
    props = {
      children: 'test button',
    }
  })

  describe('variant: default', () => {
    it('renders button with default variant (blue)', () => {
      render(props)
      const button = screen.getByText('test button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass(styles.button)
      expect(button).toHaveClass(styles.variant_default)
    })

    it('is clickable and not disabled by default', () => {
      const handleClick = vi.fn()
      props.onClick = handleClick
      render(props)
      const button = screen.getByText('test button')
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
      expect(button).not.toBeDisabled()
    })
  })

  describe('variant: alert', () => {
    beforeEach(() => {
      props.variant = 'alert'
    })

    it('renders button with alert variant (red)', () => {
      render(props)
      const button = screen.getByText('test button')
      expect(button).toHaveClass(styles.button)
      expect(button).toHaveClass(styles.variant_alert)
    })

    it('is clickable', () => {
      const handleClick = vi.fn()
      props.onClick = handleClick
      render(props)
      const button = screen.getByText('test button')
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('variant: alt', () => {
    beforeEach(() => {
      props.variant = 'alt'
    })

    it('renders button with alt variant (grey)', () => {
      render(props)
      const button = screen.getByText('test button')
      expect(button).toHaveClass(styles.button)
      expect(button).toHaveClass(styles.variant_alt)
    })

    it('is clickable', () => {
      const handleClick = vi.fn()
      props.onClick = handleClick
      render(props)
      const button = screen.getByText('test button')
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('borderRadius prop', () => {
    it('applies default border radius of 8px', () => {
      render(props)
      const button = screen.getByText('test button')
      expect(button).toHaveStyle({
        '--button-border-radius': '8px',
      })
    })

    it('applies custom border radius', () => {
      props.borderRadius = '200px'
      render(props)
      const button = screen.getByText('test button')
      expect(button).toHaveStyle({
        '--button-border-radius': '200px',
      })
    })

    it('applies custom border radius with rem units', () => {
      props.borderRadius = '1rem'
      render(props)
      const button = screen.getByText('test button')
      expect(button).toHaveStyle({
        '--button-border-radius': '1rem',
      })
    })
  })

  describe('disabled state', () => {
    beforeEach(() => {
      props.disabled = true
    })

    it('renders disabled button', () => {
      render(props)
      const button = screen.getByText('test button')
      expect(button).toBeDisabled()
    })

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn()
      props.onClick = handleClick
      render(props)
      const button = screen.getByText('test button')
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('aria-disabled state', () => {
    beforeEach(() => {
      props['aria-disabled'] = true
    })

    it('sets aria-disabled attribute', () => {
      render(props)
      const button = screen.getByText('test button')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('prevents onClick when aria-disabled', () => {
      const handleClick = vi.fn()
      props.onClick = handleClick
      render(props)
      const button = screen.getByText('test button')
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('button remains focusable when aria-disabled', () => {
      render(props)
      const button = screen.getByText('test button')
      button.focus()
      expect(button).toHaveFocus()
    })

    it('does not set aria-disabled attribute when false', () => {
      props['aria-disabled'] = false
      render(props)
      const button = screen.getByText('test button')
      expect(button).not.toHaveAttribute('aria-disabled')
    })
  })

  describe('onClick handler', () => {
    it('calls onClick when button is clicked', () => {
      const handleClick = vi.fn()
      props.onClick = handleClick
      render(props)
      const button = screen.getByText('test button')
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('passes event to onClick handler', () => {
      const handleClick = vi.fn()
      props.onClick = handleClick
      render(props)
      const button = screen.getByText('test button')
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object))
    })
  })

  describe('type attribute', () => {
    it('defaults to button type', () => {
      render(props)
      const button = screen.getByText('test button')
      expect(button).toHaveAttribute('type', 'button')
    })

    it('accepts submit type', () => {
      props.type = 'submit'
      render(props)
      const button = screen.getByText('test button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('accepts reset type', () => {
      props.type = 'reset'
      render(props)
      const button = screen.getByText('test button')
      expect(button).toHaveAttribute('type', 'reset')
    })
  })

  describe('className prop', () => {
    it('applies additional className', () => {
      props.className = 'custom-class'
      render(props)
      const button = screen.getByText('test button')
      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass(styles.button)
    })
  })

  describe('children', () => {
    it('renders text children', () => {
      render(props)
      expect(screen.getByText('test button')).toBeInTheDocument()
    })

    it('renders JSX children', () => {
      props.children = (
        <>
          <span>Icon</span>
          <span>Text</span>
        </>
      )
      render(props)
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })
  })
})
