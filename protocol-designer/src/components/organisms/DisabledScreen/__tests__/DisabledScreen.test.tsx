import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { DisabledScreen } from '..'

const render = () => {
  return renderWithProviders(<DisabledScreen />, { i18nInstance: i18n })
}

describe('DisabledScreen', () => {
  it('should render icon and text', () => {
    render()
    screen.getByText('Your browser size is too small')
    screen.getByText(
      'Resize your browser to at least 768px wide and 650px tall to continue editing your protocol'
    )
  })

  it('should render background with transparent', () => {
    render()
    expect(screen.getByLabelText('BackgroundOverlay_ModalShell')).toHaveStyle(
      `background-color: ${COLORS.black90}${COLORS.opacity40HexCode}`
    )
  })

  it('should render white text', () => {
    render()
    expect(screen.getByText('Your browser size is too small')).toHaveStyle(
      `color: ${COLORS.white}`
    )
    expect(
      screen.getByText(
        'Resize your browser to at least 768px wide and 650px tall to continue editing your protocol'
      )
    ).toHaveStyle(`color: ${COLORS.white}`)
  })
})
