import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { StepMeter } from '..'

const render = (props: React.ComponentProps<typeof StepMeter>) => {
  return renderWithProviders(<StepMeter {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('StepMeter', () => {
  let props: React.ComponentProps<typeof StepMeter>

  beforeEach(() => {
    props = {
      totalSteps: 5,
      currentStep: 0,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders progress bar at 0% width', () => {
    const { getByTestId } = render(props)
    getByTestId('StepMeter_ProgressBarContainer')
    const bar = getByTestId('StepMeter_ProgressBar')
    expect(bar).toHaveStyle('width: 0%')
  })

  it('renders progress bar at 40% width', () => {
    props = {
      ...props,
      currentStep: 2,
    }
    const { getByTestId } = render(props)
    getByTestId('StepMeter_ProgressBarContainer')
    const bar = getByTestId('StepMeter_ProgressBar')
    expect(bar).toHaveStyle('width: 40%')
  })
})
