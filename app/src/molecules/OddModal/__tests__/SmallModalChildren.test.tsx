import { fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders } from '/app/__testing-utils__'
import { SmallModalChildren } from '../SmallModalChildren'

const props = {
  header: 'header',
  subText: 'subText',
  buttonText: 'buttonText',
  handleCloseMaxPinsAlert: vi.fn(),
}
const render = () => {
  return renderWithProviders(<SmallModalChildren {...props} />)
}

describe('SmallModalChildren', () => {
  it('should have a close button and render other text', () => {
    render()
    screen.getByText('header')
    screen.getByText('subText')
    fireEvent.click(screen.getByText('buttonText'))
    expect(props.handleCloseMaxPinsAlert).toHaveBeenCalled()
  })
})
