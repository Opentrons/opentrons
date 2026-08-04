import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '/app/__testing-utils__'
import { getAppLanguage } from '/app/redux/config'

import { FullKeyboard } from '..'

import type { ComponentProps } from 'react'

vi.mock('/app/redux/config', async () => {
  const actual = await vi.importActual('/app/redux/config')
  return {
    ...actual,
    getAppLanguage: vi.fn(),
  }
})

const render = (props: ComponentProps<typeof FullKeyboard>) => {
  return renderWithProviders(<FullKeyboard {...props} />)[0]
}

const expectButtonsToBePresent = (buttonNames: string[]) => {
  buttonNames.forEach(name => {
    expect(screen.getAllByRole('button', { name }).length).toBeGreaterThan(0)
  })
}

describe('FullKeyboard', () => {
  beforeEach(() => {
    vi.mocked(getAppLanguage).mockReturnValue('en-US')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should render FullKeyboard keyboard', () => {
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
    }
    render(props)
    const expectedButtonNames = [
      'q',
      'w',
      'e',
      'r',
      't',
      'y',
      'u',
      'i',
      'o',
      'p',
      '123',
      'a',
      's',
      'd',
      'f',
      'g',
      'h',
      'j',
      'k',
      'l',
      'ABC',
      'z',
      'x',
      'c',
      'v',
      'b',
      'n',
      'm',
      'del',
      '{globe}',
      'space',
      'return',
    ]

    expectButtonsToBePresent(expectedButtonNames)
  })

  it('should render full keyboard when hitting ABC key', async () => {
    const user = userEvent.setup()
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
    }
    render(props)
    const shiftKey = screen.getByRole('button', { name: 'ABC' })
    await user.click(shiftKey)
    const expectedButtonNames = [
      'Q',
      'W',
      'E',
      'R',
      'T',
      'Y',
      'U',
      'I',
      'O',
      'P',
      '123',
      'A',
      'S',
      'D',
      'F',
      'G',
      'H',
      'J',
      'K',
      'L',
      'ABC',
      'Z',
      'X',
      'C',
      'V',
      'B',
      'N',
      'M',
      'del',
      '{globe}',
      'space',
      'return',
    ]

    expectButtonsToBePresent(expectedButtonNames)
  })

  it('should render full keyboard when hitting 123 key', async () => {
    const user = userEvent.setup()
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
    }
    render(props)
    const numberKey = screen.getByRole('button', { name: '123' })
    await user.click(numberKey)
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
      'abc',
      '-',
      '/',
      ':',
      ';',
      '(',
      ')',
      '$',
      '&',
      '@',
      '"',
      '#+=',
      '.',
      ',',
      '?',
      '!',
      "'",
      '*',
      '~',
      'del',
      '{globe}',
      'space',
      'return',
    ]

    expectButtonsToBePresent(expectedButtonNames)
  })

  it('should render the software keyboards when hitting #+= key', async () => {
    const user = userEvent.setup()
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
    }
    render(props)
    const numberKey = screen.getByRole('button', { name: '123' })
    await user.click(numberKey)
    const symbolKey = screen.getByRole('button', { name: '#+=' })
    await user.click(symbolKey)
    const expectedButtonNames = [
      '[',
      ']',
      '{',
      '}',
      '%',
      '^',
      '+',
      'abc',
      '_',
      '\\',
      '|',
      '<',
      '>',
      '#',
      '=',
      '123',
      '.',
      ',',
      '?',
      '!',
      "'",
      '*',
      '~',
      'del',
      '{globe}',
      'space',
      'return',
    ]

    expectButtonsToBePresent(expectedButtonNames)
  })

  it('should call mock function when clicking a key', async () => {
    const user = userEvent.setup()
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
    }
    render(props)
    const aKey = screen.getByRole('button', { name: 'a' })
    await user.click(aKey)
    expect(props.onChange).toHaveBeenCalled()
  })

  it('should render chinese default labels when app language is zh-CN', () => {
    vi.mocked(getAppLanguage).mockReturnValue('zh-CN')
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
    }

    render(props)

    expect(screen.getByRole('button', { name: '空格' })).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: '换行' }).length
    ).toBeGreaterThan(0)
  })

  it('should update labels when toggling keyboard language', async () => {
    vi.mocked(getAppLanguage).mockReturnValue('zh-CN')
    const user = userEvent.setup()
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
    }

    render(props)

    const globeKey = screen
      .getAllByRole('button')
      .find(button => button.className.includes('hg-globe'))

    expect(globeKey).toBeDefined()
    await user.click(globeKey!)

    expect(screen.getByRole('button', { name: 'English (US)' })).toBeDefined()
    expect(
      screen.getAllByRole('button', { name: 'return' }).length
    ).toBeGreaterThan(0)

    await waitFor(() => {
      expect(
        screen.getAllByRole('button', { name: 'space' }).length
      ).toBeGreaterThan(0)
    })

    expect(
      screen.getAllByRole('button', { name: 'return' }).length
    ).toBeGreaterThan(0)
  })
})
