import { FormProvider, useForm } from 'react-hook-form'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import { i18n } from '/ai-client/i18n'

import { ProtocolFormatSection } from '../'

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
