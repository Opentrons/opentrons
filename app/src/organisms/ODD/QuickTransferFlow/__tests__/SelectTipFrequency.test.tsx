import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
    screen.getByText('Once')
    screen.getByText('Per source')
  })

  it('renders once at the start of the transfer option only', () => {
    props.state.sourceWells = []
    props.state.destinationWells = []
    props.state.path = 'single'
    render(props)
    screen.getByText('Once')
  })

  it('renders once at the start of the transfer option only', () => {
    props.state.transferType = 'distribute'
    render(props)
    screen.getByText('Per destination')
  })

  it('should call mock function when tappin exit button', () => {
    render(props)
    fireEvent.click(screen.getByText('Exit'))
    expect(props.exitButtonProps.onClick).toHaveBeenCalled()
  })

  it('should call mock function when tappin continue button', () => {
    render(props)
    fireEvent.click(screen.getByText('Once'))
    fireEvent.click(screen.getByText('Continue'))
    expect(props.onNext).toHaveBeenCalled()
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_CHANGE_TIP',
      changeTip: 'once',
    })
  })
})
