import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'

import { TouchControlButton } from '..'

import type { ComponentProps } from 'react'

const mockOnClick = vi.fn()

const render = (props: ComponentProps<typeof TouchControlButton>) => {
  return renderWithProviders(<TouchControlButton {...props} />)[0]
}

describe('TouchControlButton', () => {
  let props: ComponentProps<typeof TouchControlButton>
  beforeEach(() => {
    props = {
      title: 'touch control button',
      isActive: true,
      onClick: mockOnClick,
      subText: 'touch control subtext',
      isOnDevice: false,
    }
  })
  it('renders touch control button active on desktop', () => {
    render(props)
    const button = screen.getByRole('button')
    expect(button).toHaveStyle(`background-color: ${COLORS.white}`)
    expect(button).toHaveStyle(`border: 1px ${COLORS.blue50} solid`)
  })
  it('renders touch control button inactive on desktop', () => {
    props.isActive = false
    render(props)
    const button = screen.getByRole('button')
    expect(button).toHaveStyle(`background-color: ${COLORS.white}`)
    expect(button).toHaveStyle(`border: 1px ${COLORS.grey30} solid`)
  })

  it('renders touch control button active on ODD', () => {
    props.isOnDevice = true
    render(props)
    const button = screen.getByRole('button')
    expect(button).toHaveStyle(`background-color: ${COLORS.blue50}`)
    expect(button).toHaveStyle(`border: 1px ${COLORS.grey30} solid`)
  })
  it('renders touch control button inactive on ODD', () => {
    props.isActive = false
    props.isOnDevice = true
    render(props)
    const button = screen.getByRole('button')
    expect(button).toHaveStyle(`background-color: ${COLORS.blue35}`)
    expect(button).toHaveStyle(`border: 1px ${COLORS.grey30} solid`)
  })
})
