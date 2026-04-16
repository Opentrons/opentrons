import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { PerStepOverflowMenu } from '../PerStepOverflowMenu'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof PerStepOverflowMenu>) => {
  return renderWithProviders(<PerStepOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })
}

const mockSetShowPerStepOverflowMenu = vi.fn()
const mockSetMilliSecondsPerFrame = vi.fn()

describe('PerStepOverflowMenu', () => {
  let props: ComponentProps<typeof PerStepOverflowMenu>

  beforeEach(() => {
    props = {
      setShowPerStepOverflowMenu: mockSetShowPerStepOverflowMenu,
      setMilliSecondsPerFrame: mockSetMilliSecondsPerFrame,
    }
  })
  it('renders the overflow menu with 3 buttons', () => {
    render(props)
    screen.getByText('2s per step')
    screen.getByText('3s per step')
    screen.getByText('4s per step')
  })

  it('calls the setSelectedPerdStep function when clicking the 2 seconds per step button', () => {
    render(props)
    fireEvent.click(screen.getByText('2s per step'))
    expect(mockSetMilliSecondsPerFrame).toHaveBeenCalledWith(2000)
    expect(mockSetShowPerStepOverflowMenu).toHaveBeenCalledWith(false)
  })
})
