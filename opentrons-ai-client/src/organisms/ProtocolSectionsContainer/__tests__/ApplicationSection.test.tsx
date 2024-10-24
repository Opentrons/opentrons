import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ProtocolSectionsContainer } from '..'
import { FormProvider, useForm } from 'react-hook-form'
import { Provider } from 'jotai'
import { fillApplicationSectionAndClickConfirm } from '../../../resources/utils/createProtocolTestUtils'

const TestFormProviderComponent = () => {
  const methods = useForm({
    defaultValues: {},
  })

  return (
    <FormProvider {...methods}>
      <Provider>
        <ProtocolSectionsContainer />
      </Provider>
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

    expect(screen.getByText('Application')).toBeInTheDocument()
    expect(screen.getByText('Instruments')).toBeInTheDocument()
    expect(screen.getByText('Modules')).toBeInTheDocument()
    expect(screen.getByText('Labware & Liquids')).toBeInTheDocument()
    expect(screen.getByText('Steps')).toBeInTheDocument()
  })

  it('should render the ApplicationSection opened by default', () => {
    render()

    expect(screen.getByRole('button', { name: 'Application' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
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
})
