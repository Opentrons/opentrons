import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { HeaderWithMeter } from '../index'
import { describe, expect, it } from 'vitest'
import { screen, render as rtlRender } from '@testing-library/react'

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<HeaderWithMeter progressPercentage={0.3} />, {
    i18nInstance: i18n,
  })
}

describe('HeaderWithMeter', () => {
  it('should render Header component', () => {
    render()
    screen.getByText('Opentrons')
  })

  it('should render progress bar', () => {
    render()
    screen.getByRole('progressbar')
  })

  it('should render progress bar with correct value', () => {
    render()
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('value', '0.3')
  })

  it('should update when progressPercentage prop changes', () => {
    const { rerender } = rtlRender(
      <HeaderWithMeter progressPercentage={0.3} />,
      {}
    )

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('value', '0.3')

    rerender(<HeaderWithMeter progressPercentage={0.6} />)
    expect(progressBar).toHaveAttribute('value', '0.6')

    rerender(<HeaderWithMeter progressPercentage={1} />)
    expect(progressBar).toHaveAttribute('value', '1')

    rerender(<HeaderWithMeter progressPercentage={0} />)
    expect(progressBar).toHaveAttribute('value', '0')

    rerender(<HeaderWithMeter progressPercentage={0.2} />)
    expect(progressBar).toHaveAttribute('value', '0.2')
  })
})
