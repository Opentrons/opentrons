import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { BORDERS, COLORS } from '@opentrons/components'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'

import { NoParameter } from '../NoParameter'

const render = () => {
  return renderWithProviders(<NoParameter />, {
    i18nInstance: i18n,
  })
}

describe('NoParameter', () => {
  it('should render text and icon with proper color', () => {
    render()
    screen.getByLabelText('alert')
    screen.getByText('No parameters specified in this protocol')
  })

  it('should have proper styles', () => {
    render()
    expect(screen.getByTestId('NoRunTimeParameter')).toHaveStyle(
      `background-color: ${COLORS.grey30}`
    )
    expect(screen.getByTestId('NoRunTimeParameter')).toHaveStyle(
      `border-radius: ${BORDERS.borderRadius8}`
    )
    expect(screen.getByLabelText('alert')).toHaveStyle(
      `color: ${COLORS.grey60}`
    )
  })
})
