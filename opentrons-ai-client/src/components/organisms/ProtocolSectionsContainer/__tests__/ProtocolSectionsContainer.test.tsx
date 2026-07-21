import { FormProvider, useForm } from 'react-hook-form'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import {
  OPENTRONS_FLEX,
  ROBOT_FIELD_NAME,
} from '/ai-client/components/organisms/InstrumentsSection'
import { i18n } from '/ai-client/i18n'
import { fillApplicationSectionAndClickConfirm } from '/ai-client/resources/utils/createProtocolTestUtils'

import { ProtocolSectionsContainer } from '..'

const TestFormProviderComponent = ({ defaultValues = {} } = {}) => {
  const methods = useForm({
    defaultValues,
  })

  return (
    <FormProvider {...methods}>
      <ProtocolSectionsContainer />
    </FormProvider>
  )
}

const render = (defaultValues = {}): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(
    <TestFormProviderComponent defaultValues={defaultValues} />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ProtocolSectionsContainer', () => {
  it('should render all five accordions for each step of Protocol Creation', () => {
    render()
    expect(screen.getByText('Application')).toBeInTheDocument()
    expect(screen.getByText('Instruments')).toBeInTheDocument()
    expect(screen.getByText('Modules')).toBeInTheDocument()
    expect(screen.getByText('Labware & Liquids')).toBeInTheDocument()
    expect(screen.getByText('Steps')).toBeInTheDocument()
  })

  it('should render the Application section opened by default', () => {
    render()

    expect(
      screen.getByRole('button', { name: 'Application' })
    ).toHaveAttribute('aria-expanded', 'true')
  })

  it('should render all the other sections closed by default', () => {
    render()

    expect(screen.getByRole('button', { name: 'Instruments' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    expect(screen.getByRole('button', { name: 'Modules' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    expect(
      screen.getByRole('button', { name: 'Labware & Liquids' })
    ).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Steps' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('should go back to previous section when clicking on the previous section', async () => {
    render()

    const applicationButton = screen.getByRole('button', {
      name: 'Application',
    })
    expect(applicationButton).toHaveAttribute('aria-expanded', 'true')

    await fillApplicationSectionAndClickConfirm()

    await waitFor(() => {
      expect(applicationButton).toHaveAttribute('aria-expanded', 'false')
    })
    fireEvent.click(applicationButton)

    await waitFor(() => {
      expect(applicationButton).toHaveAttribute('aria-expanded', 'true')
    })
  })

  it('should not allow user to go to a future section', async () => {
    render()

    const instrumentsButton = screen.getByRole('button', {
      name: 'Instruments',
    })
    expect(instrumentsButton).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(instrumentsButton)

    await waitFor(() => {
      expect(instrumentsButton).toHaveAttribute('aria-expanded', 'false')
    })
  })

  it('should include Runtime Parameters section between Labware & Liquids and Steps', () => {
    render({
      [ROBOT_FIELD_NAME]: OPENTRONS_FLEX,
    })

    // Get all accordion buttons
    const buttons = screen.getAllByRole('button', {
      name: /Application|Instruments|Modules|Labware & Liquids|Runtime Parameters|Steps/,
    })

    // Verify order of sections by their headings
    expect(buttons[0]).toHaveTextContent('Application')
    expect(buttons[1]).toHaveTextContent('Instruments')
    expect(buttons[2]).toHaveTextContent('Modules')
    expect(buttons[3]).toHaveTextContent('Labware & Liquids')
    expect(buttons[4]).toHaveTextContent('Runtime Parameters')
    expect(buttons[5]).toHaveTextContent('Steps')
  })
})
