import { useRef } from 'react'
import { renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { NumericalKeyboard } from '..'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof NumericalKeyboard>) => {
  return renderWithProviders(<NumericalKeyboard {...props} />)[0]
}

describe('NumericalKeyboard', () => {
  it('should render numerical keyboard isDecimal: false and hasHyphen: false', () => {
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: false,
      hasHyphen: false,
    }
    render(props)
    const buttons = screen.getAllByRole('button')
    const expectedButtonNames = [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '0',
      'del',
    ]

    buttons.forEach((button, index) => {
      const expectedName = expectedButtonNames[index]
      expect(button).toHaveTextContent(expectedName)
    })
  })

  it('should render numerical keyboard isDecimal: false and hasHyphen: true', () => {
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: false,
      hasHyphen: true,
    }
    render(props)
    const buttons = screen.getAllByRole('button')
    const expectedButtonNames = [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '0',
      '-',
      'del',
    ]

    buttons.forEach((button, index) => {
      const expectedName = expectedButtonNames[index]
      expect(button).toHaveTextContent(expectedName)
    })
  })

  it('should render numerical keyboard isDecimal: true and hasHyphen: false', () => {
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: true,
      hasHyphen: false,
    }
    render(props)
    const buttons = screen.getAllByRole('button')
    const expectedButtonNames = [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '0',
      '.',
      'del',
    ]

    buttons.forEach((button, index) => {
      const expectedName = expectedButtonNames[index]
      expect(button).toHaveTextContent(expectedName)
    })
  })

  it('should render numerical keyboard isDecimal: true and hasHyphen: true', () => {
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: true,
      hasHyphen: true,
    }
    render(props)
    const buttons = screen.getAllByRole('button')
    const expectedButtonNames = [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '0',
      '.',
      '-',
      'del',
    ]

    buttons.forEach((button, index) => {
      const expectedName = expectedButtonNames[index]
      expect(button).toHaveTextContent(expectedName)
    })
  })

  it('should call mock function when clicking num key', async () => {
    const user = userEvent.setup()
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: false,
      hasHyphen: false,
    }
    render(props)
    const numKey = screen.getByRole('button', { name: '1' })
    await user.click(numKey)
    expect(props.onChange).toHaveBeenCalled()
  })

  it('should call mock function when clicking decimal point key', async () => {
    const user = userEvent.setup()
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: true,
      hasHyphen: false,
    }
    render(props)
    const numKey = screen.getByRole('button', { name: '.' })
    await user.click(numKey)
    expect(props.onChange).toHaveBeenCalled()
  })

  it('should call mock function when clicking hyphen key', async () => {
    const user = userEvent.setup()
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: true,
      hasHyphen: true,
    }
    render(props)
    const numKey = screen.getByRole('button', { name: '-' })
    await user.click(numKey)
    expect(props.onChange).toHaveBeenCalled()
  })
})
