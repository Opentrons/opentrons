import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ProtocolFormatSection } from '../'
import { FormProvider, useForm } from 'react-hook-form'

const TestFormProviderComponent = () => {
  const methods = useForm({
    defaultValues: {},
  })

  return (
    <FormProvider {...methods}>
      <ProtocolFormatSection />

      <p>{`form is ${methods.formState.isValid ? 'valid' : 'invalid'}`}</p>
    </FormProvider>
  )
}

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<TestFormProviderComponent />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolFormatSection', () => {
  it('should render a protocol format section', () => {
    render()

    expect(
      screen.getByText(
        'What file format should OpentronsAI use to generate the protocol?'
      )
    ).toBeInTheDocument()
  })
})
