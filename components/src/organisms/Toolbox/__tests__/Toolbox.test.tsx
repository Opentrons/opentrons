import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../testing/utils'
import { Toolbox } from '../index'

const render = (props: React.ComponentProps<typeof Toolbox>) => {
  return renderWithProviders(<Toolbox {...props} />)
}

describe('Toolbox', () => {
  let props: React.ComponentProps<typeof Toolbox>

  it('should render text and buttons', () => {
    props = {
      header: 'header',
      children: <div>mock children</div>,
      doneButtonText: 'done',
      headerIconName: 'swap-horizontal',
      onCloseClick: vi.fn(),
      exitButtonText: 'exit',
    }
    render(props)
    screen.getByText('header')
    screen.getByText('done')
    fireEvent.click(screen.getByTestId('Toolbox_doneButton'))
    expect(props.onCloseClick).toHaveBeenCalled()
    screen.getByText('mock children')
    screen.getByText('exit')
    fireEvent.click(screen.getByTestId('Toolbox_exit'))
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
