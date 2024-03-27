import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, renderHook, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import { NumericalKeyboard } from '..'

const render = (props: React.ComponentProps<typeof NumericalKeyboard>) => {
  return renderWithProviders(<NumericalKeyboard {...props} />)[0]
}

describe('NumericalKeyboard', () => {
  it('should render numerical keyboard isDecimal: false and allowNegative: false', () => {
    const { result } = renderHook(() => React.useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: false,
      allowNegative: false,
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

  it('should render numerical keyboard isDecimal: false and allowNegative: true', () => {
    const { result } = renderHook(() => React.useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: false,
      allowNegative: true,
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

  it('should render numerical keyboard isDecimal: true and allowNegative: false', () => {
    const { result } = renderHook(() => React.useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: true,
      allowNegative: false,
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

  it('should render numerical keyboard isDecimal: true and allowNegative: true', () => {
    const { result } = renderHook(() => React.useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: true,
      allowNegative: true,
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
    const { result } = renderHook(() => React.useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: false,
      allowNegative: false,
    }
    render(props)
    const numKey = screen.getByRole('button', { name: '1' })
    fireEvent.click(numKey)
    expect(props.onChange).toHaveBeenCalled()
  })

  it('should call mock function when clicking decimal point key', () => {
    const { result } = renderHook(() => React.useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: true,
      allowNegative: false,
    }
    render(props)
    const numKey = screen.getByRole('button', { name: '.' })
    fireEvent.click(numKey)
    expect(props.onChange).toHaveBeenCalled()
  })

  it('should call mock function when clicking hyphen key', () => {
    const { result } = renderHook(() => React.useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      isDecimal: true,
      allowNegative: true,
    }
    render(props)
    const numKey = screen.getByRole('button', { name: '-' })
    fireEvent.click(numKey)
    expect(props.onChange).toHaveBeenCalled()
  })
})
