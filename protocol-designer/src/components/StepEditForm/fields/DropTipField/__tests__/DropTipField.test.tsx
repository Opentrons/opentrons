import type * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { fixtureTiprack1000ul } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../assets/localization'
import { getAllTiprackOptions } from '../../../../../ui/labware/selectors'
import { getEnableReturnTip } from '../../../../../feature-flags/selectors'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
} from '../../../../../step-forms/selectors'
import { DropTipField } from '../index'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../../../../../step-forms/selectors')
vi.mock('../../../../../ui/labware/selectors')
vi.mock('../../../../../feature-flags/selectors')
const render = (props: React.ComponentProps<typeof DropTipField>) => {
  return renderWithProviders(<DropTipField {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockDropTip = 'dropTip_location'
const mockTrashBin = 'trashBinId'
const mockLabwareId = 'mockId'
describe('DropTipField', () => {
  let props: React.ComponentProps<typeof DropTipField>

  beforeEach(() => {
    props = {
      name: mockDropTip,
      value: mockTrashBin,
      updateValue: vi.fn(),
      onFieldBlur: vi.fn(),
      onFieldFocus: vi.fn(),
      disabled: false,
    }

    vi.mocked(getAdditionalEquipmentEntities).mockReturnValue({
      [mockTrashBin]: { name: 'trashBin', location: 'A3', id: mockTrashBin },
    })
    vi.mocked(getEnableReturnTip).mockReturnValue(true)
    vi.mocked(getAllTiprackOptions).mockReturnValue([
      { name: 'mock tip', value: mockLabwareId },
    ])
    vi.mocked(getLabwareEntities).mockReturnValue({
      [mockLabwareId]: {
        id: mockLabwareId,
        labwareDefURI: 'mock uri',
        def: fixtureTiprack1000ul as LabwareDefinition2,
      },
    })
  })
  it('renders the label and dropdown field with trash bin selected as default', () => {
    render(props)
    screen.getByText('drop tip location')
    screen.getByRole('combobox', { name: '' })
    screen.getByRole('option', { name: 'Trash Bin' })
    screen.getByRole('option', { name: 'mock tip' })
  })
  it('renders dropdown as disabled', () => {
    props.disabled = true
    render(props)
    expect(screen.getByRole('combobox', { name: '' })).toBeDisabled()
  })
})
