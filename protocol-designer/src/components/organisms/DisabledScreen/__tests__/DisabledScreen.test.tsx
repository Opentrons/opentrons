import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { COLORS } from '@opentrons/components'

import { DisabledScreen } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'

const render = () => {
  return renderWithProviders(<DisabledScreen />, { i18nInstance: i18n })
}

describe('DisabledScreen', () => {
  it('should render icon and text', () => {
    render()
    screen.getByTestId('browser_icon_in_DisabledScreen')
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
})
