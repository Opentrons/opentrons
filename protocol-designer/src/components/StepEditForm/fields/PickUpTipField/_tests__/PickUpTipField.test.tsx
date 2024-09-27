import type * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'

import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../assets/localization'
import { getAllTiprackOptions } from '../../../../../ui/labware/selectors'
import { PickUpTipField } from '../index'

vi.mock('../../../../../ui/labware/selectors')
const render = (props: React.ComponentProps<typeof PickUpTipField>) => {
  return renderWithProviders(<PickUpTipField {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockPickUpTip = 'pickUpTip_location'
const mockLabwareId = 'mockId'
describe('PickUpTipField', () => {
  let props: React.ComponentProps<typeof PickUpTipField>

  beforeEach(() => {
    props = {
      name: mockPickUpTip,
      value: '',
      updateValue: vi.fn(),
      onFieldBlur: vi.fn(),
      onFieldFocus: vi.fn(),
      disabled: false,
    }
    vi.mocked(getAllTiprackOptions).mockReturnValue([
      { name: 'mock tip', value: mockLabwareId },
    ])
  })
  it('renders the label and dropdown field with default pick up tip selected as default', () => {
    render(props)
    screen.getByText('pick up tip')
    screen.getByRole('combobox', { name: '' })
    screen.getByRole('option', { name: 'Default - get next tip' })
    screen.getByRole('option', { name: 'mock tip' })
  })
  it('renders dropdown as disabled', () => {
    props.disabled = true
    render(props)
    expect(screen.getByRole('combobox', { name: '' })).toBeDisabled()
  })
})
