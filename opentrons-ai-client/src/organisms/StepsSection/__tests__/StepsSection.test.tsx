import { FormProvider, useForm } from 'react-hook-form'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { StepsSection } from '../../StepsSection'

const TestFormProviderComponent = () => {
  const methods = useForm({
    defaultValues: {
      steps: '',
    },
  })

  const steps = methods.watch('steps')

  return (
    <FormProvider {...methods}>
      <StepsSection />

      <p>{steps}</p>

      <p>{`form is ${methods.formState.isValid ? 'valid' : 'invalid'}`}</p>
    </FormProvider>
  )
}

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<TestFormProviderComponent />, {
    i18nInstance: i18n,
  })
}

describe('StepsSection', () => {
  it('should render StepsSection', () => {
    render()

    expect(
      screen.getByText(
        'Give step-by-step instructions on how to handle liquids, with quantities in microliters (uL) and exact source and destination locations within labware. Always err on the side of providing extra information!'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByText('Example:')).toBeInTheDocument()
  })

  it('should render example text', () => {
    render()

    expect(screen.getByText('Example:')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Use right pipette to transfer 15 uL of mastermix from source well to destination well. Use the same pipette tip for all transfers.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Use left pipette to transfer 10 ul of sample from the source to destination well. Mix the sample and mastermix of 25 ul total volume 9 times. Blow out to `destination well`. Use a new tip for each transfer.'
      )
    ).toBeInTheDocument()
  })

  it('should add step description when the text area is filled', () => {
    render()

    const textbox = screen.getByRole('textbox')

    fireEvent.change(textbox, {
      target: { value: 'description test' },
    })

    expect(textbox).toHaveValue('description test')
  })

  it('should update form state to valid when steps have been added', async () => {
    render()

    expect(screen.getByText('form is invalid')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'description test' },
    })

    await waitFor(() => {
      expect(screen.getByText('form is valid')).toBeInTheDocument()
    })
  })
})
