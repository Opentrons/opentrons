import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../testing/utils'
import { FixtureOption } from '../index'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof FixtureOption>) => {
  return renderWithProviders(<FixtureOption {...props} />)
}

describe('FixtureOption', () => {
  let props: ComponentProps<typeof FixtureOption>

  it('should render text and buttons for desktop app', () => {
    props = {
      onClickHandler: vi.fn(),
      optionName: 'mockOption',
      buttonText: 'mockText',
      isOnDevice: false,
    }
    render(props)
    screen.getByText('mockOption')
    screen.getByText('mockText')
    fireEvent.click(screen.getByTestId('mockOption'))
    expect(props.onClickHandler).toHaveBeenCalled()
  })
  it('should render text and buttons for odd', () => {
    props = {
      onClickHandler: vi.fn(),
      optionName: 'mockOption',
      buttonText: 'mockText',
      isOnDevice: true,
    }
    render(props)
    screen.getByText('mockOption')
    screen.getByText('mockText')
    fireEvent.click(screen.getByRole('button'))
    expect(props.onClickHandler).toHaveBeenCalled()
  })
})
