import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { renderWithProviders } from '../../../testing/utils'
import { BORDERS, COLORS } from '../../../helix-design-system'
import { NoParameters } from '../NoParameters'

const render = (props: React.ComponentProps<typeof NoParameters>) => {
  return renderWithProviders(<NoParameters {...props} />)
}

const tMock = (key: string) => key

describe('NoParameters', () => {
  it('should render text and icon with proper color', () => {
    render({})
    screen.getByLabelText('alert')
    screen.getByText('No parameters specified in this protocol')
  })

  it('should have proper styles', () => {
    render({})
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

  it('should render the raw i18n value if a t is provided', () => {
    render({
      t: tMock,
    })
    screen.getByText('no_parameters_specified')
  })
})
