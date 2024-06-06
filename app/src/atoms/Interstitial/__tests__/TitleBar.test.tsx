import * as React from 'react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { InterstitialTitleBar } from '../InterstitiallTitleBar'

const render = (props: React.ComponentProps<typeof InterstitialTitleBar>) => {
  return renderWithProviders(<InterstitialTitleBar {...props} />)[0]
}

describe('TitleBar', () => {
  let props: React.ComponentProps<typeof InterstitialTitleBar>
  const EXIT = { title: 'EXIT', onClick: vi.fn(), children: 'EXIT' }

  beforeEach(() => {
    props = {
      title: 'TITLE',
      exit: EXIT,
    }
  })

  it('should render everything when back is defined and clicks button', () => {
    render(props)
    screen.getByText('TITLE')
    screen.getByLabelText('ot-logo')
    screen.getByLabelText('close')
    screen.getByText('EXIT')
    const button = screen.getByRole('button', { name: /close_btn/i })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(EXIT.onClick).toBeCalled()
  })
})
