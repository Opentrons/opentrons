import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { renderWithProviders } from '@opentrons/components'
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
      title: 'Tip Length Calibrations',
      totalSteps: 5,
      currentStep: 1,
      body: <div>this is a body</div>,
      exit: jest.fn(),
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct information with no step count visible and pressing on button calls props', () => {
    const { getByText, getByRole } = render(props)
    getByText('Tip Length Calibrations')
    const exit = getByRole('button', { name: 'exit' })
    getByText('this is a body')
    fireEvent.click(exit)
    expect(props.exit).toHaveBeenCalled()
  })

  it('renders correct information with step count visible', () => {
    props = {
      ...props,
      showStepCount: true,
    }

    const { getByText, getByRole } = render(props)
    getByText('Tip Length Calibrations')
    getByRole('button', { name: 'exit' })
    getByText('this is a body')
    getByText('Step: 1 / 5')
  })
  it('renders correct information with a footer', () => {
    props = {
      ...props,
      footer: <div>this is a footer</div>,
    }

    const { getByText, getByRole } = render(props)
    getByText('Tip Length Calibrations')
    getByRole('button', { name: 'exit' })
    getByText('this is a body')
    getByText('this is a footer')
  })
})
