import { describe, it, beforeEach, vi, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { SelectTipFrequency } from '../SelectTipFrequency'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof SelectTipFrequency>) => {
  return renderWithProviders(<SelectTipFrequency {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SelectTipFrequency', () => {
  let props: ComponentProps<typeof SelectTipFrequency>

  beforeEach(() => {
    props = {
      onNext: vi.fn(),
      onBack: vi.fn(),
      exitButtonProps: {
        buttonType: 'tertiaryLowLight',
        buttonText: 'Exit',
        onClick: vi.fn(),
      },
      state: {
        pipette: {
          displayName: 'Flex 1-Channel 50 µL',
          model: 'p50',
          displayCategory: 'FLEX',
          validNozzleMaps: {
            maps: {
              SingleA1: ['A1'],
            },
          },
        },
        destinationWells: ['A1'],
        sourceWells: ['A1'],
        path: 'single',
      } as any,
      dispatch: vi.fn(),
    }
  })

  it('renders text, exit button and continue button', () => {
    render(props)
    screen.getByText('Select change tip frequency')
    screen.getByText('Exit')
    screen.getByText('Continue')
    screen.getByText('Once at the start of the transfer')
    screen.getByText('Per source well')
  })

  it('should call mock function when tappin exit button', () => {
    render(props)
    fireEvent.click(screen.getByText('Exit'))
    expect(props.exitButtonProps.onClick).toHaveBeenCalled()
  })

  it('should call mock function when tappin continue button', () => {
    render(props)
    fireEvent.click(screen.getByText('Once at the start of the transfer'))
    fireEvent.click(screen.getByText('Continue'))
    expect(props.onNext).toHaveBeenCalled()
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_CHANGE_TIP',
      changeTip: 'once',
    })
  })
})
