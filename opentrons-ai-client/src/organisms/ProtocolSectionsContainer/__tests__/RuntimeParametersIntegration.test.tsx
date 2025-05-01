import { FormProvider, useForm } from 'react-hook-form'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProtocolSectionsContainer } from '..'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { PROTOCOL_FORMAT, PYTHON } from '../../../resources/constants'
import { OPENTRONS_FLEX, ROBOT_FIELD_NAME } from '../../InstrumentsSection'

const TestFormProviderComponent = () => {
  const methods = useForm({
    defaultValues: {
      [PROTOCOL_FORMAT]: PYTHON,
      [ROBOT_FIELD_NAME]: OPENTRONS_FLEX,
    },
  })

  return (
    <FormProvider {...methods}>
      <ProtocolSectionsContainer />
    </FormProvider>
  )
}

describe('ProtocolSectionsContainer with Runtime Parameters', () => {
  it('should include Runtime Parameters section between Labware & Liquids and Steps', () => {
    renderWithProviders(<TestFormProviderComponent />, {
      i18nInstance: i18n,
    })

    // Get all accordion buttons
    const buttons = screen.getAllByRole('button', {
      name: /Protocol Format|Application|Instruments|Modules|Labware & Liquids|Runtime Parameters|Steps/,
    })

    // Verify order of sections by their headings
    expect(buttons[0]).toHaveTextContent('Protocol Format')
    expect(buttons[1]).toHaveTextContent('Application')
    expect(buttons[2]).toHaveTextContent('Instruments')
    expect(buttons[3]).toHaveTextContent('Modules')
    expect(buttons[4]).toHaveTextContent('Labware & Liquids')
    expect(buttons[5]).toHaveTextContent('Runtime Parameters')
    expect(buttons[6]).toHaveTextContent('Steps')
  })
})
