import { FormProvider, useForm } from 'react-hook-form'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProtocolSectionsContainer } from '..'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { fillProtocolFormatSectionAndClickConfirm } from '../../../resources/utils/createProtocolTestUtils'

const TestFormProviderComponent = () => {
  const methods = useForm({
    defaultValues: {},
  })

  return (
    <FormProvider {...methods}>
      <ProtocolSectionsContainer />
    </FormProvider>
  )
}

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<TestFormProviderComponent />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolSectionsContainer', () => {
  it('should render all five accordions for each step of Protocol Creation', () => {
    render()
    expect(screen.getByText('Protocol Format')).toBeInTheDocument()
    expect(screen.getByText('Application')).toBeInTheDocument()
    expect(screen.getByText('Instruments')).toBeInTheDocument()
    expect(screen.getByText('Modules')).toBeInTheDocument()
    expect(screen.getByText('Labware & Liquids')).toBeInTheDocument()
    expect(screen.getByText('Steps')).toBeInTheDocument()
  })

  it('should render the Protocol Format section opened by default', () => {
    render()

    expect(
      screen.getByRole('button', { name: 'Protocol Format' })
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

    const protocolFormatButton = screen.getByRole('button', {
      name: 'Protocol Format',
    })
    expect(protocolFormatButton).toHaveAttribute('aria-expanded', 'true')

    await fillProtocolFormatSectionAndClickConfirm()

    await waitFor(() => {
      expect(protocolFormatButton).toHaveAttribute('aria-expanded', 'false')
    })
    fireEvent.click(protocolFormatButton)

    await waitFor(() => {
      expect(protocolFormatButton).toHaveAttribute('aria-expanded', 'true')
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
})
