import * as React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen, cleanup } from '@testing-library/react'
import { BORDERS, COLORS } from '@opentrons/components'
import { i18n } from '../../../../localization'
import { renderWithProviders } from '../../../../__testing-utils__'
import { EquipmentOption } from '../EquipmentOption'

const render = (props: React.ComponentProps<typeof EquipmentOption>) => {
  return renderWithProviders(<EquipmentOption {...props} />, { i18nInstance: i18n })[0]
}

describe('EquipmentOption', () => {
  let props: React.ComponentProps<typeof EquipmentOption>

  beforeEach(() => {
    props = {
      onClick: vi.fn(),
      isSelected: false,
      text: 'mockText',
    }
  })
  afterEach(() => {
    cleanup()
  })
  it('renders the equipment option without checkbox or image', () => {
    render(props)
    screen.getByText('mockText')
  })
  it('renders the equipment option that is disabled', () => {
    props = {
      ...props,
      disabled: true,
    }
    render(props)
    expect(screen.getByLabelText('EquipmentOption_flex_mockText')).toHaveStyle(
      `background-color: ${COLORS.white}`
    )
  })
  it('renders the equipment option without check not selected and image', () => {
    props = {
      ...props,
      showCheckbox: true,
      image: <img src="img" />,
    }
    render(props)
    screen.getByText('mockText')
    screen.getByRole('img')
    expect(
      screen.getByLabelText('EquipmentOption_checkbox-blank-outline')
    ).toHaveStyle(`color: ${COLORS.grey50}`)
    expect(screen.getByLabelText('EquipmentOption_flex_mockText')).toHaveStyle(
      `border: 1px ${BORDERS.styleSolid} ${COLORS.grey35}`
    )
  })
  it('renders the equipment option without check selected', () => {
    props = {
      ...props,
      isSelected: true,
      showCheckbox: true,
    }
    render(props)
    screen.getByText('mockText')
    expect(screen.getByLabelText('EquipmentOption_checkbox-marked')).toHaveStyle(
      `color: ${COLORS.blue50}`
    )
    expect(screen.getByLabelText('EquipmentOption_flex_mockText')).toHaveStyle(
      `border: ${BORDERS.activeLineBorder}`
    )
  })
})
