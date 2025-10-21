import { beforeEach, describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'

import { StepMeter } from '..'
import { renderWithProviders } from '../../../testing/utils'
import styles from '../stepmeter.module.css'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof StepMeter>) => {
  return renderWithProviders(<StepMeter {...props} />)
}

describe('StepMeter', () => {
  let props: ComponentProps<typeof StepMeter>

  beforeEach(() => {
    props = {
      totalSteps: 5,
      currentStep: 0,
    }
  })

  it('renders StepMeterBar at 0% width', () => {
    render(props)
    screen.getByTestId('StepMeter_StepMeterContainer')
    const bar = screen.getByTestId('StepMeter_StepMeterBar')
    expect(bar).toHaveStyle('width: 0%')
  })

  it('renders StepMeterBar at 40% width', () => {
    props = {
      ...props,
      currentStep: 2,
    }
    render(props)
    screen.getByTestId('StepMeter_StepMeterContainer')
    const bar = screen.getByTestId('StepMeter_StepMeterBar')
    expect(bar).toHaveStyle('width: 40%')
  })

  it('renders StepMeterBar at 100% width when currentStep is above totalStep', () => {
    props = {
      ...props,
      currentStep: 6,
    }
    render(props)
    screen.getByTestId('StepMeter_StepMeterContainer')
    const bar = screen.getByTestId('StepMeter_StepMeterBar')
    expect(bar).toHaveStyle('width: 100%')
  })

  it('should transition with style when progressing forward and no style if progressing backward', () => {
    props = {
      ...props,
      currentStep: 2,
    }
    const [{ rerender }] = render(props)

    props = {
      ...props,
      currentStep: 3,
    }
    rerender(<StepMeter {...props} />)

    const bar = screen.getByTestId('StepMeter_StepMeterBar')
    expect(bar).toHaveClass(styles.step_meter_bar_animated)

    props = {
      ...props,
      currentStep: 1,
    }
    rerender(<StepMeter {...props} />)

    const barAfterBackward = screen.getByTestId('StepMeter_StepMeterBar')
    expect(barAfterBackward).not.toHaveClass(styles.step_meter_bar_animated)
  })
})
