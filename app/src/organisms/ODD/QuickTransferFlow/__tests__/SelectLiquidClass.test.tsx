import { describe, it, beforeEach, vi, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { SelectLiquidClass } from '../SelectLiquidClass'

import type { ComponentProps } from 'react'

const mockNoLiquidClass = {
  byPipette: [],
  description: 'Default',
  displayName: "Don't use liquid class settings",
  liquidClassName: 'none',
  namespace: 'opentrons',
  schemaVersion: 1,
}

const render = (props: ComponentProps<typeof SelectLiquidClass>) => {
  return renderWithProviders(<SelectLiquidClass {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SelectLiquidClass', () => {
  let props: ComponentProps<typeof SelectLiquidClass>

  beforeEach(() => {
    props = {
      onNext: vi.fn(),
      onBack: vi.fn(),
      exitButtonProps: {
        buttonType: 'tertiaryLowLight',
        buttonText: 'Exit',
        onClick: vi.fn(),
      },
      state: {},
      dispatch: vi.fn(),
    }
  })

  it('renders text, exit button and continue button', () => {
    render(props)
    screen.getByText('Select liquid class')
    screen.getByText(
      'Apply predefined settings for the type of liquid used in your transfer'
    )
    screen.getByText('Exit')
    screen.getByText('Continue')
    screen.getByText("Don't use liquid class settings")
    screen.getByText('Default')
    screen.getByText('Aqueous')
    screen.getByText('Deionized water')
    screen.getByText('Viscous')
    screen.getByText('50% glycerol')
    screen.getByText('Volatile')
    screen.getByText('80% ethanol')
  })

  it('should call mock function when tappin exit button', () => {
    render(props)
    fireEvent.click(screen.getByText('Exit'))
    expect(props.exitButtonProps.onClick).toHaveBeenCalled()
  })

  it('should call mock function when tapping continue button - not using liquid class', () => {
    render(props)
    fireEvent.click(screen.getByText("Don't use liquid class settings"))
    fireEvent.click(screen.getByText('Continue'))
    expect(props.onNext).toHaveBeenCalled()
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_LIQUID_CLASS',
      liquidClass: mockNoLiquidClass,
    })
  })

  // it('should call mock function when tapping continue button - aqueous', () => {
  //   render(props)
  //   fireEvent.click(screen.getByText("Don't use liquid class settings"))
  //   fireEvent.click(screen.getByText('Continue'))
  //   expect(props.onNext).toHaveBeenCalled()
  //   expect(props.dispatch).toHaveBeenCalledWith({
  //     type: 'SET_LIQUID_CLASS',
  //     liquidClass: mockNoLiquidClass,
  //   })
  // })

  // it('should call mock function when tapping continue button - viscous', () => {
  //   render(props)
  //   fireEvent.click(screen.getByText("Don't use liquid class settings"))
  //   fireEvent.click(screen.getByText('Continue'))
  //   expect(props.onNext).toHaveBeenCalled()
  //   expect(props.dispatch).toHaveBeenCalledWith({
  //     type: 'SET_LIQUID_CLASS',
  //     liquidClass: mockNoLiquidClass,
  //   })
  // })

  // it('should call mock function when tapping continue button - volatile', () => {
  //   render(props)
  //   fireEvent.click(screen.getByText("Don't use liquid class settings"))
  //   fireEvent.click(screen.getByText('Continue'))
  //   expect(props.onNext).toHaveBeenCalled()
  //   expect(props.dispatch).toHaveBeenCalledWith({
  //     type: 'SET_LIQUID_CLASS',
  //     liquidClass: mockNoLiquidClass,
  //   })
  // })
})
