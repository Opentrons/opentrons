import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'

import { WizardHeader } from '..'
import { StepMeter } from '../../../atoms/StepMeter'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'

vi.mock('../../../atoms/StepMeter')

const render = (props: ComponentProps<typeof WizardHeader>) => {
  return renderWithProviders(<WizardHeader {...props} />)
}

describe('WizardHeader', () => {
  let props: ComponentProps<typeof WizardHeader>

  beforeEach(() => {
    props = {
      title: 'Tip Length Calibrations',
      totalSteps: 5,
      onExit: vi.fn(),
      currentStep: 1,
    }
    vi.mocked(StepMeter).mockReturnValue(<div>step meter</div>)
  })

  it('renders correct information with step count visible and pressing on button calls props', () => {
    render(props)
    screen.getByText('Tip Length Calibrations')
    const exit = screen.getByRole('button', { name: 'Exit' })
    fireEvent.click(exit)
    expect(props.onExit).toHaveBeenCalled()
    screen.getByText('step meter')
    screen.getByText('Step 1 / 5')
  })

  it('renders correct information when on device display is true', () => {
    render(props)
    screen.getByText('Tip Length Calibrations')
    const exit = screen.getByRole('button', { name: 'Exit' })
    fireEvent.click(exit)
    expect(props.onExit).toHaveBeenCalled()
    screen.getByText('step meter')
    screen.getByText('Step 1 / 5')
  })

  it('renders exit button as disabled when isDisabled is true', () => {
    props = {
      ...props,
      exitDisabled: true,
    }
    render(props)
    screen.getByText('Tip Length Calibrations')
    const exit = screen.getByRole('button', { name: 'Exit' })
    expect(exit).toBeDisabled()
  })

  it('renders correct information with no step count visible due to currentStep = 0', () => {
    props = {
      ...props,
      currentStep: 0,
    }

    render(props)
    screen.getByText('Tip Length Calibrations')
    screen.getByRole('button', { name: 'Exit' })
    expect(screen.queryByText('Step 0 / 5')).not.toBeInTheDocument()
  })

  it('renders correct information with no step count visible due to error state', () => {
    props = {
      ...props,
      currentStep: null,
    }

    render(props)
    screen.getByText('Tip Length Calibrations')
    screen.getByRole('button', { name: 'Exit' })
    expect(screen.queryByText('Step 1 / 5')).not.toBeInTheDocument()
  })
})
