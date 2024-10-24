import { fireEvent, screen, waitFor } from '@testing-library/react'
import { expect } from 'vitest'

export async function fillApplicationSectionAndClickConfirm(): Promise<void> {
  const applicationDropdown = screen.getByText('Select an option')
  fireEvent.click(applicationDropdown)

  const basicAliquotingOption = screen.getByText('Basic aliquoting')
  fireEvent.click(basicAliquotingOption)

  const describeInput = screen.getByRole('textbox')
  fireEvent.change(describeInput, { target: { value: 'Test description' } })

  const confirmButton = screen.getByText('Confirm')
  await waitFor(() => {
    expect(confirmButton).toBeEnabled()
  })
  fireEvent.click(confirmButton)
}
