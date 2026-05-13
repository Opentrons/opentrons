import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, renderHook, screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'

import {
  applyNumericalKeyboardKey,
  isValidNumericalInput,
  NumericalKeyboard,
  StatelessNumericalKeyboard,
} from '..'

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

  it('should call mock function when clicking num key', () => {
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: false,
      hasHyphen: false,
    }
    render(props)
    const numKey = screen.getByRole('button', { name: '1' })
    fireEvent.click(numKey)
    expect(props.onChange).toHaveBeenCalled()
  })

  it('should call mock function when clicking decimal point key', () => {
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: true,
      hasHyphen: false,
    }
    render(props)
    const numKey = screen.getByRole('button', { name: '.' })
    fireEvent.click(numKey)
    expect(props.onChange).toHaveBeenCalled()
  })

  it('should call mock function when clicking hyphen key', () => {
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: true,
      hasHyphen: true,
    }
    render(props)
    const numKey = screen.getByRole('button', { name: '-' })
    fireEvent.click(numKey)
    expect(props.onChange).toHaveBeenCalled()
  })

  it('should emit the next controlled value from the stateless keyboard', () => {
    const props = {
      value: '1',
      onChange: vi.fn(),
      isDecimal: true,
      hasHyphen: false,
    }
    renderWithProviders(<StatelessNumericalKeyboard {...props} />)[0]

    fireEvent.click(screen.getByRole('button', { name: '.' }))

    expect(props.onChange).toHaveBeenCalledWith('1.')
  })

  it('should not accumulate duplicate decimal points in the stateless keyboard', () => {
    const props = {
      value: '1.',
      onChange: vi.fn(),
      isDecimal: true,
      hasHyphen: false,
    }
    renderWithProviders(<StatelessNumericalKeyboard {...props} />)[0]

    fireEvent.click(screen.getByRole('button', { name: '.' }))

    expect(props.onChange).toHaveBeenCalledWith('1.')
  })

  it('should apply numerical keyboard keys without internal keyboard state', () => {
    expect(
      applyNumericalKeyboardKey('1', '.', { allowDecimal: true })
    ).toBe('1.')
    expect(
      applyNumericalKeyboardKey('1.', '.', { allowDecimal: true })
    ).toBe('1.')
    expect(applyNumericalKeyboardKey('', '-', { allowNegative: true })).toBe(
      '-'
    )
    expect(applyNumericalKeyboardKey('12', 'del')).toBe('1')
  })

  it('should validate numerical input strings', () => {
    expect(isValidNumericalInput('1.', { allowDecimal: true })).toBe(true)
    expect(isValidNumericalInput('.', { allowDecimal: true })).toBe(true)
    expect(isValidNumericalInput('1..', { allowDecimal: true })).toBe(false)
    expect(isValidNumericalInput('-1', { allowNegative: true })).toBe(true)
    expect(isValidNumericalInput('-1')).toBe(false)
  })
})
