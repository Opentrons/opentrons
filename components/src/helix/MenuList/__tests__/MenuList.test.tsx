import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MenuList } from '..'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof MenuList>) => {
  return renderWithProviders(<MenuList {...props} />)[0]
}

const mockBtn = <div key="fakeKey">mockBtn</div>

describe('MenuList', () => {
  let props: ComponentProps<typeof MenuList>
  beforeEach(() => {
    props = {
      children: mockBtn,
    }
  })

  it('renders a child not on device', () => {
    render(props)
    screen.getByText('mockBtn')
  })
  it('renders isOnDevice child, clicking background overlay calls onClick', () => {
    props = {
      ...props,
      isOnDevice: true,
      onClick: vi.fn(),
    }
    render(props)
    fireEvent.click(screen.getByLabelText('BackgroundOverlay_ModalShell'))
    expect(props.onClick).toHaveBeenCalled()
  })

  it('positions menu above trigger when opensUpward is true', () => {
    render({ ...props, opensUpward: true })
    const menu = screen.getByTestId('MenuList')
    expect(menu.style.bottom).toBe('2.6rem')
    expect(menu.style.top).toBe('')
  })

  it('positions menu below trigger when opensUpward is false', () => {
    render({ ...props, opensUpward: false })
    const menu = screen.getByTestId('MenuList')
    expect(menu.style.top).toBe('2.6rem')
    expect(menu.style.bottom).toBe('')
  })
})
