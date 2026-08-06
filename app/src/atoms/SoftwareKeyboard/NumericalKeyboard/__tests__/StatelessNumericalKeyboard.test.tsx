import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { StatelessNumericalKeyboard } from '../StatelessNumericalKeyboard'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof StatelessNumericalKeyboard>) => {
  return renderWithProviders(<StatelessNumericalKeyboard {...props} />)[0]
}

describe('StatelessNumericalKeyboard', () => {
  it('should render numerical keyboard isDecimal: false and hasHyphen: false', () => {
    const props = {
      value: '',
      onChange: vi.fn(),
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
    const props = {
      value: '',
      onChange: vi.fn(),
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
    const props = {
      value: '',
      onChange: vi.fn(),
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
    const props = {
      value: '',
      onChange: vi.fn(),
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

  it('should emit the next value when clicking a number key', async () => {
    const user = userEvent.setup()
    const props = {
      value: '1',
      onChange: vi.fn(),
      isDecimal: false,
      hasHyphen: false,
    }
    render(props)
    await user.click(screen.getByRole('button', { name: '2' }))

    expect(props.onChange).toHaveBeenCalledWith('12')
  })

  it('should emit the next value when clicking a decimal point key', async () => {
    const user = userEvent.setup()
    const props = {
      value: '1',
      onChange: vi.fn(),
      isDecimal: true,
      hasHyphen: false,
    }
    render(props)

    await user.click(screen.getByRole('button', { name: '.' }))

    expect(props.onChange).toHaveBeenCalledWith('1.')
  })

  it('should not accumulate duplicate decimal points', async () => {
    const user = userEvent.setup()
    const props = {
      value: '1.',
      onChange: vi.fn(),
      isDecimal: true,
      hasHyphen: false,
    }
    render(props)

    await user.click(screen.getByRole('button', { name: '.' }))

    expect(props.onChange).toHaveBeenCalledWith('1.')
  })

  it('should emit the next value when clicking a hyphen key at the start', async () => {
    const user = userEvent.setup()
    const props = {
      value: '',
      onChange: vi.fn(),
      isDecimal: false,
      hasHyphen: true,
    }
    render(props)

    await user.click(screen.getByRole('button', { name: '-' }))

    expect(props.onChange).toHaveBeenCalledWith('-')
  })

  it('should ignore a hyphen key when the value is not empty', async () => {
    const user = userEvent.setup()
    const props = {
      value: '1',
      onChange: vi.fn(),
      isDecimal: false,
      hasHyphen: true,
    }
    render(props)

    await user.click(screen.getByRole('button', { name: '-' }))

    expect(props.onChange).toHaveBeenCalledWith('1')
  })

  it('should delete the last character when clicking del', async () => {
    const user = userEvent.setup()
    const props = {
      value: '12',
      onChange: vi.fn(),
      isDecimal: false,
      hasHyphen: false,
    }
    render(props)

    await user.click(screen.getByRole('button', { name: 'del' }))

    expect(props.onChange).toHaveBeenCalledWith('1')
  })

  it('should call onKeyPress with the normalized key', async () => {
    const user = userEvent.setup()
    const props = {
      value: '12',
      onChange: vi.fn(),
      onKeyPress: vi.fn(),
      isDecimal: false,
      hasHyphen: false,
    }
    render(props)

    await user.click(screen.getByRole('button', { name: 'del' }))

    expect(props.onKeyPress).toHaveBeenCalledWith('del')
  })
})
