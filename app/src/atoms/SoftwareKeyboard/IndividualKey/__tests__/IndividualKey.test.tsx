import { useRef } from 'react'
import { renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { IndividualKey } from '..'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof IndividualKey>) => {
  return renderWithProviders(<IndividualKey {...props} />)[0]
}

describe('IndividualKey', () => {
  it('should render the text key', () => {
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      keyText: 'mockKey',
    }
    render(props)
    screen.getByRole('button', { name: 'mockKey' })
  })

  it('should call mock function when clicking text key', async () => {
    const user = userEvent.setup()
    const { result } = renderHook(() => useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      keyText: 'mockKey',
    }
    render(props)
    const textKey = screen.getByRole('button', { name: 'mockKey' })
    await user.click(textKey)
    expect(props.onChange).toHaveBeenCalled()
  })
})
