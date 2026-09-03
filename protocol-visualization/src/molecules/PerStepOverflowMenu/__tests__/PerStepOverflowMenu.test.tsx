import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PerStepOverflowMenu } from '../'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'

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
  it('renders the overflow menu with 5 buttons', () => {
    render(props)
    screen.getByText('4x')
    screen.getByText('2x')
    screen.getByText('1x')
    screen.getByText('0.5x')
    screen.getByText('0.33x')
  })

  it('calls the setSelectedPerdStep function when clicking the 1x per step button', () => {
    render(props)
    fireEvent.click(screen.getByText('1x'))
    expect(mockSetMilliSecondsPerFrame).toHaveBeenCalledWith(1000)
    expect(mockSetShowPerStepOverflowMenu).toHaveBeenCalledWith(false)
  })
})
