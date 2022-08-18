import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { StepMeter } from '../../../atoms/StepMeter'
import { WizardHeader } from '..'

jest.mock('../../StepMeter')

const mockStepMeter = StepMeter as jest.MockedFunction<typeof StepMeter>

const render = (props: React.ComponentProps<typeof WizardHeader>) => {
  return renderWithProviders(<WizardHeader {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('WizardHeader', () => {
  let props: React.ComponentProps<typeof WizardHeader>

  beforeEach(() => {
    props = {
      title: 'Tip Length Calibrations',
      totalSteps: 5,
      onExit: jest.fn(),
      currentStep: 1,
    }
    mockStepMeter.mockReturnValue(<div>step meter</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct information with step count visible and pressing on button calls props', () => {
    const { getByText, getByRole } = render(props)
    getByText('Tip Length Calibrations')
    const exit = getByRole('button', { name: 'Exit' })
    fireEvent.click(exit)
    expect(props.onExit).toHaveBeenCalled()
    getByText('step meter')
    getByText('Step: 1 / 5')
  })

  it('renders correct information with no step count visible', () => {
    props = {
      ...props,
      currentStep: 0,
    }

    const { getByText, getByRole } = render(props)
    getByText('Tip Length Calibrations')
    getByRole('button', { name: 'Exit' })
    expect(screen.queryByText('Step: 0 / 5')).not.toBeInTheDocument()
  })
})
