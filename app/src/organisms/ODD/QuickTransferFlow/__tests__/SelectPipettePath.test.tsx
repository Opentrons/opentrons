import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { SelectPipettePath } from '../SelectPipettePath'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof SelectPipettePath>) => {
  return renderWithProviders(<SelectPipettePath {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SelectPipettePath', () => {
  let props: ComponentProps<typeof SelectPipettePath>

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
        sourceWells: ['A1'],
        destinationWells: ['A1'],
      } as any,
      dispatch: vi.fn(),
    }
  })

  it('renders text, exit button and continue button', () => {
    render(props)
    screen.getByText('Select pipette path')
    screen.getByText('Exit')
    screen.getByText('Continue')
  })

  it('should render single transfer when transfer is 1:1', () => {
    render(props)
    screen.getByText('Single transfers')
  })

  it('should render single transfer when transfer is n:n', () => {
    props.state.sourceWells = ['A1', 'A2']
    props.state.destinationWells = ['A1', 'A2']
    render(props)
    screen.getByText('Single transfers')
  })

  it('should render single transfer when transfer is 1:n', () => {
    props.state.sourceWells = ['A1']
    props.state.destinationWells = ['A1', 'A2']
    render(props)
    screen.getByText('Single transfers')
    screen.getByText('Multi-dispense')
  })

  it('should render single transfer when transfer is n:1', () => {
    props.state.sourceWells = ['A1', 'A2']
    props.state.destinationWells = ['A1']
    render(props)
    screen.getByText('Single transfers')
    screen.getByText('Multi-aspirate')
  })

  it('should call mock function when tapping exit button', () => {
    render(props)
    fireEvent.click(screen.getByText('Exit'))
    expect(props.exitButtonProps.onClick).toHaveBeenCalled()
  })

  it('should call mock function when tappin continue button', () => {
    render(props)
    fireEvent.click(screen.getByText('Single transfers'))
    fireEvent.click(screen.getByText('Continue'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_PIPETTE_PATH',
      path: 'single',
    })
    expect(props.onNext).toHaveBeenCalled()
  })
})
