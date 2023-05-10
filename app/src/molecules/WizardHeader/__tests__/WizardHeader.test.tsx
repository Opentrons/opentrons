import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { getIsOnDevice } from '../../../redux/config'
import { StepMeter } from '../../../atoms/StepMeter'
import { WizardHeader } from '..'

jest.mock('../../../atoms/StepMeter')
jest.mock('../../../redux/config')

const mockStepMeter = StepMeter as jest.MockedFunction<typeof StepMeter>
const mockGetIsOnDevice = getIsOnDevice as jest.MockedFunction<
  typeof getIsOnDevice
>
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
    mockGetIsOnDevice.mockReturnValue(false)
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
    getByText('Step 1 / 5')
  })

  it('renders correct information when on device display is true', () => {
    mockGetIsOnDevice.mockReturnValue(true)
    const { getByText, getByRole } = render(props)
    getByText('Tip Length Calibrations')
    const exit = getByRole('button', { name: 'Exit' })
    fireEvent.click(exit)
    expect(props.onExit).toHaveBeenCalled()
    getByText('step meter')
    getByText('Step 1 / 5')
  })

  it('renders exit button as disabled when isDisabled is true', () => {
    props = {
      ...props,
      exitDisabled: true,
    }
    const { getByText, getByRole } = render(props)
    getByText('Tip Length Calibrations')
    const exit = getByRole('button', { name: 'Exit' })
    expect(exit).toBeDisabled()
  })

  it('renders correct information with no step count visible due to currentStep = 0', () => {
    props = {
      ...props,
      currentStep: 0,
    }

    const { getByText, getByRole } = render(props)
    getByText('Tip Length Calibrations')
    getByRole('button', { name: 'Exit' })
    expect(screen.queryByText('Step 0 / 5')).not.toBeInTheDocument()
  })

  it('renders correct information with no step count visible due to error state', () => {
    props = {
      ...props,
      currentStep: null,
    }

    const { getByText, getByRole } = render(props)
    getByText('Tip Length Calibrations')
    getByRole('button', { name: 'Exit' })
    expect(screen.queryByText('Step 1 / 5')).not.toBeInTheDocument()
  })
})
