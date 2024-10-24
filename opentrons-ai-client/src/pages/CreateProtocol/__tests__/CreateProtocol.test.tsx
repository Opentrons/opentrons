import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { CreateProtocol } from '..'
import { Provider } from 'jotai'
import { fillApplicationSectionAndClickConfirm } from '../../../resources/utils/createProtocolTestUtils'

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(
    <Provider>
      <CreateProtocol />
    </Provider>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('CreateProtocol', () => {
  it('should update the active section when user fills the section information and clicks the confirm button', async () => {
    render()

    const buttonsAndAccordions = screen.getAllByRole('button')
    expect(buttonsAndAccordions[0]).toHaveAttribute('aria-expanded', 'true')

    await fillApplicationSectionAndClickConfirm()

    await waitFor(() => {
      expect(buttonsAndAccordions[0]).toHaveAttribute('aria-expanded', 'false')
    })
  })

  it('should display the Prompt preview correctly for Application section', async () => {
    render()

    await fillApplicationSectionAndClickConfirm()

    const previewItems = screen.getAllByTestId('Tag_default')

    expect(previewItems).toHaveLength(2)
    expect(previewItems[0]).toHaveTextContent('Basic aliquoting')
    expect(previewItems[1]).toHaveTextContent('Test description')
  })

  it('should display the Prompt preview correctly for Application section if Other application is selected', () => {
    render()

    const applicationDropdown = screen.getByText('Select an option')
    fireEvent.click(applicationDropdown)

    const basicAliquotingOption = screen.getByText('Other')
    fireEvent.click(basicAliquotingOption)

    const [otherInput, describeInput] = screen.getAllByRole('textbox')

    fireEvent.change(otherInput, { target: { value: 'Test Application' } })
    fireEvent.change(describeInput, { target: { value: 'Test description' } })

    const confirmButton = screen.getByText('Confirm')
    fireEvent.click(confirmButton)

    const promptPreview = screen.getByText('Prompt')
    expect(promptPreview).toBeInTheDocument()

    const previewItems = screen.getAllByTestId('Tag_default')
    expect(previewItems).toHaveLength(2)
    expect(previewItems[0]).toHaveTextContent('Test Application')
    expect(previewItems[1]).toHaveTextContent('Test description')
  })

  it('should display a completed checkmark if the section is completed', async () => {
    render()

    expect(screen.queryByTestId('accordion-ot-check')).not.toBeInTheDocument()

    const buttonsAndAccordions = screen.getAllByRole('button')
    expect(buttonsAndAccordions[0]).toHaveAttribute('aria-expanded', 'true')

    await fillApplicationSectionAndClickConfirm()

    expect(screen.getByTestId('accordion-ot-check')).toBeInTheDocument()
  })
})
