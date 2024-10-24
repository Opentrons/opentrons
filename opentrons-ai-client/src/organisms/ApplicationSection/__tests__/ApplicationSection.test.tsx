import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ApplicationSection } from '..'
import { FormProvider, useForm } from 'react-hook-form'

// TODO move to __testing-utils__
const TestFormProviderComponent = () => {
  const methods = useForm({
    defaultValues: {},
  })

  return (
    <FormProvider {...methods}>
      <ApplicationSection />
    </FormProvider>
  )
}

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<TestFormProviderComponent />, {
    i18nInstance: i18n,
  })
}

describe('ApplicationSection', () => {
  it('should render scientific application dropdown, describe input and confirm button', () => {
    render()

    expect(
      screen.getByText("What's your scientific application?")
    ).toBeInTheDocument()
    expect(
      screen.getByText('Describe what you are trying to do')
    ).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })

  it('should not render other application dropdown if Other option is not selected', () => {
    render()

    expect(screen.queryByText('Other application')).not.toBeInTheDocument()
  })

  it('should render other application dropdown if Other option is selected', () => {
    render()

    const applicationDropdown = screen.getByText('Select an option')
    fireEvent.click(applicationDropdown)

    const otherOption = screen.getByText('Other')
    fireEvent.click(otherOption)

    expect(screen.getByText('Other application')).toBeInTheDocument()
  })

  it('should enable confirm button when all fields are filled', async () => {
    render()

    const applicationDropdown = screen.getByText('Select an option')
    fireEvent.click(applicationDropdown)

    const basicAliquotingOption = screen.getByText('Basic aliquoting')
    fireEvent.click(basicAliquotingOption)

    const describeInput = screen.getByRole('textbox')
    fireEvent.change(describeInput, { target: { value: 'Test description' } })

    const confirmButton = screen.getByRole('button')
    await waitFor(() => {
      expect(confirmButton).toBeEnabled()
    })
  })

  it('should disable confirm button when all fields are not filled', () => {
    render()

    const confirmButton = screen.getByRole('button')
    expect(confirmButton).toBeDisabled()
  })
})
