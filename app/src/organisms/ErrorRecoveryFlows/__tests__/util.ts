import { screen, fireEvent } from '@testing-library/react'

export function clickButtonLabeled(label: string): void {
  const buttons = screen.getAllByRole('button', { name: label })
  fireEvent.click(buttons[0])
}
