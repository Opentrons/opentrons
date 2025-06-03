import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { StepMeter } from '../'
import { COLORS } from '../../../helix-design-system'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'

const renderer = (props: ComponentProps<typeof StepMeter>) => {
  return renderWithProviders(<StepMeter {...props} />)
}

describe('StepMeter', () => {
  let props: ComponentProps<typeof StepMeter>

  beforeEach(() => {
    props = {
      totalSteps: 10,
      currentStep: 5,
    }
  })

  it('should render StepMeterContainer', () => {
    renderer(props)

    const stepMeterContainer = screen.getByTestId(
      'StepMeter_StepMeterContainer'
    )
    expect(stepMeterContainer).toHaveStyle({
      height: '0.25rem',
      backgroundColor: COLORS.grey30,
    })
  })
  it('should render StepMeterBar 50%', () => {
    renderer(props)

    const stepMeterBar = screen.getByTestId('StepMeter_StepMeterBar')
    expect(stepMeterBar).toHaveStyle({
      width: '50%',
      height: '100%',
      backgroundColor: COLORS.blue50,
    })
  })
})
