import { useRef } from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { IndividualKey } from '..'

import type { KeyboardReactInterface } from 'react-simple-keyboard'

function TestKeyboard(): JSX.Element {
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)
  const inputElementRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input data-testid="IndividualKey_Input" ref={inputElementRef} />
      <IndividualKey
        keyboardRef={keyboardRef}
        inputElementRef={inputElementRef}
        keyText="mockKey"
      />
    </>
  )
}

const render = () => {
  return renderWithProviders(<TestKeyboard />)[0]
}

describe('IndividualKey', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render the text key', () => {
    render()
    screen.getByRole('button', { name: 'mockKey' })
  })

  it('should update the input when clicking keys', async () => {
    const user = userEvent.setup()
    render()
    await user.click(screen.getByRole('button', { name: 'mockKey' }))
    expect(screen.getByTestId('IndividualKey_Input')).toHaveValue('mockKey')
  })
})
