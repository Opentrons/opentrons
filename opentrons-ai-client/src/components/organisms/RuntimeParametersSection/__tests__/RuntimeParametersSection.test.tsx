import { FormProvider, useForm } from 'react-hook-form'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import {
  OPENTRONS_FLEX,
  OPENTRONS_OT2,
  ROBOT_FIELD_NAME,
} from '/ai-client/components/organisms/InstrumentsSection'
import { i18n } from '/ai-client/i18n'

import { RuntimeParametersSection } from '..'

const TestFormProviderComponent = ({
  robotType = OPENTRONS_FLEX,
}: {
  robotType?: string
}) => {
  const methods = useForm({
    defaultValues: {
      [ROBOT_FIELD_NAME]: robotType,
      runtime_parameters: '',
    },
  })

  return (
    <FormProvider {...methods}>
      <RuntimeParametersSection />
    </FormProvider>
  )
}

describe('RuntimeParametersSection', () => {
  it('should render the input field when robot type is Flex', () => {
    renderWithProviders(
      <TestFormProviderComponent robotType={OPENTRONS_FLEX} />,
      {
        i18nInstance: i18n,
      }
    )

    expect(
      screen.getByTestId('RuntimeParametersSection_inputArea')
    ).toBeInTheDocument()
    expect(screen.getByText('Define Runtime Parameters')).toBeInTheDocument()
    expect(screen.getByText('Optional')).toBeInTheDocument()
  })

  it('should render the input field when robot type is OT2', () => {
    renderWithProviders(
      <TestFormProviderComponent robotType={OPENTRONS_OT2} />,
      {
        i18nInstance: i18n,
      }
    )

    expect(
      screen.getByTestId('RuntimeParametersSection_inputArea')
    ).toBeInTheDocument()
    expect(screen.getByText('Define Runtime Parameters')).toBeInTheDocument()
    expect(screen.getByText('Optional')).toBeInTheDocument()
  })
})
