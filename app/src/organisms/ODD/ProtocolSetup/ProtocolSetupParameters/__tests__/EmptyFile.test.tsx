import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { i18n } from '/app/i18n'
import { renderWithProviders } from '/app/__testing-utils__'

import { EmptyFile } from '../EmptyFile'

const render = () => {
  return renderWithProviders(<EmptyFile />, {
    i18nInstance: i18n,
  })
}

describe('EmptyFile', () => {
  it('should render icon and text', () => {
    render()
    screen.getByTestId('EmptyFile_icon')
    screen.getByText('No files found')
  })

  it('should render the correct styles', () => {
    render()
    const element = screen.getByTestId('EmptyFile')
    expect(element).toHaveStyle(`background-color: ${COLORS.grey35}`)
    expect(element).toHaveStyle(
      `padding: ${SPACING.spacing40} ${SPACING.spacing80}`
    )
    expect(element).toHaveStyle(`justify-content: ${JUSTIFY_CENTER}`)
    expect(element).toHaveStyle(`align-items: ${ALIGN_CENTER}`)
    expect(element).toHaveStyle(`border-radius: ${BORDERS.borderRadius16}`)

    const text = screen.getByText('No files found')
    expect(text).toHaveStyle(`font-size: ${TYPOGRAPHY.fontSize28}`)
    expect(text).toHaveStyle(`line-height: ${TYPOGRAPHY.lineHeight36}`)
    expect(text).toHaveStyle(`font-weight: ${TYPOGRAPHY.fontWeightSemiBold}`)
  })
})
