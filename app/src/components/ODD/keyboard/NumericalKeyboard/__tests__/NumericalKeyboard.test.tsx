import { useRef } from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { NumericalKeyboard } from '..'

import type { KeyboardReactInterface } from 'react-simple-keyboard'

interface TestKeyboardProps {
  isDecimal?: boolean
  hasHyphen?: boolean
}

function TestKeyboard({
  isDecimal = false,
  hasHyphen = false,
}: TestKeyboardProps): JSX.Element {
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)
  const inputElementRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input data-testid="NumericalKeyboard_Input" ref={inputElementRef} />
      <NumericalKeyboard
        keyboardRef={keyboardRef}
        inputElementRef={inputElementRef}
        isDecimal={isDecimal}
        hasHyphen={hasHyphen}
      />
    </>
  )
}

const render = (props: TestKeyboardProps = {}) => {
  return renderWithProviders(<TestKeyboard {...props} />)[0]
}

describe('NumericalKeyboard', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render numerical keyboard isDecimal: false and hasHyphen: false', () => {
    render({ isDecimal: false, hasHyphen: false })
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
    render({ isDecimal: false, hasHyphen: true })
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
    render({ isDecimal: true, hasHyphen: false })
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
    render({ isDecimal: true, hasHyphen: true })
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

  it('should update the input when clicking a number key', async () => {
    const user = userEvent.setup()
    render({ isDecimal: false, hasHyphen: false })
    await user.click(screen.getByRole('button', { name: '1' }))
    expect(screen.getByTestId('NumericalKeyboard_Input')).toHaveValue('1')
  })

  it('should update the input when clicking a decimal point key', async () => {
    const user = userEvent.setup()
    render({ isDecimal: true, hasHyphen: false })
    await user.click(screen.getByRole('button', { name: '.' }))
    expect(screen.getByTestId('NumericalKeyboard_Input')).toHaveValue('.')
  })

  it('should update the input when clicking a hyphen key', async () => {
    const user = userEvent.setup()
    render({ isDecimal: true, hasHyphen: true })
    await user.click(screen.getByRole('button', { name: '-' }))
    expect(screen.getByTestId('NumericalKeyboard_Input')).toHaveValue('-')
  })
})
