import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { ODDFixtureOption } from '..'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof ODDFixtureOption>) => {
  return renderWithProviders(<ODDFixtureOption {...props} />)
}

describe('ODDFixtureOption', () => {
  let props: ComponentProps<typeof ODDFixtureOption>

  it('should render text and buttons for desktop app', () => {
    props = {
      onClickHandler: vi.fn(),
      optionName: 'mockOption',
      buttonText: 'mockText',
    }
    render(props)
    screen.getByText('mockOption')
    screen.getByText('mockText')
    fireEvent.click(screen.getByRole('button', { name: 'mockText' }))
    expect(props.onClickHandler).toHaveBeenCalled()
  })
  it('should render text and buttons for odd', () => {
    props = {
      onClickHandler: vi.fn(),
      optionName: 'mockOption',
      buttonText: 'mockText',
    }
    render(props)
    screen.getByText('mockOption')
    screen.getByText('mockText')
    fireEvent.click(screen.getByRole('button'))
    expect(props.onClickHandler).toHaveBeenCalled()
  })
})
