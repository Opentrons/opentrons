import { FormProvider, useForm } from 'react-hook-form'
import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import {
  OPENTRONS_FLEX,
  OPENTRONS_OT2,
  ROBOT_FIELD_NAME,
} from '/ai-client/components/organisms/InstrumentsSection'
import { i18n } from '/ai-client/i18n'
import { PD, PROTOCOL_FORMAT, PYTHON } from '/ai-client/resources/constants'

import { RuntimeParametersSection } from '..'

const TestFormProviderComponent = ({
  protocolFormat = PYTHON,
  robotType = OPENTRONS_FLEX,
}: {
  protocolFormat?: string
  robotType?: string
}) => {
  const methods = useForm({
    defaultValues: {
      [PROTOCOL_FORMAT]: protocolFormat,
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
  it('should render the input field when protocol format is Python and robot type is Flex', () => {
    renderWithProviders(
      <TestFormProviderComponent
        protocolFormat={PYTHON}
        robotType={OPENTRONS_FLEX}
      />,
      { i18nInstance: i18n }
    )

    expect(
      screen.getByTestId('RuntimeParametersSection_inputArea')
    ).toBeInTheDocument()
    expect(screen.getByText('Define Runtime Parameters')).toBeInTheDocument()
    expect(screen.getByText('Optional')).toBeInTheDocument()
  })

  it('should not render the input field when protocol format is PD', async () => {
    renderWithProviders(
      <TestFormProviderComponent
        protocolFormat={PD}
        robotType={OPENTRONS_FLEX}
      />,
      { i18nInstance: i18n }
    )

    // Wait until the input area disappears
    await waitFor(() => {
      expect(
        screen.queryByTestId('RuntimeParametersSection_inputArea')
      ).not.toBeInTheDocument()
    })

    // Then check the InfoScreen message is present
    expect(
      screen.getByText(
        'Runtime Parameters are only available for Python protocols on Opentrons Flex.'
      )
    ).toBeInTheDocument()
  })

  it('should not render the input field when robot type is OT2', async () => {
    renderWithProviders(
      <TestFormProviderComponent
        protocolFormat={PYTHON}
        robotType={OPENTRONS_OT2}
      />,
      { i18nInstance: i18n }
    )

    await waitFor(() => {
      expect(
        screen.queryByTestId('RuntimeParametersSection_inputArea')
      ).not.toBeInTheDocument()
    })

    expect(
      screen.getByText(
        'Runtime Parameters are only available for Python protocols on Opentrons Flex.'
      )
    ).toBeInTheDocument()
  })
})
