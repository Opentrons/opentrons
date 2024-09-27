import type * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { i18n } from '../../../assets/localization'
import { renderWithProviders } from '../../../__testing-utils__'
import { MultipleModulesRow } from '../MultipleModulesRow'
import {
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V2,
} from '@opentrons/shared-data'
import { FlexSlotMap } from '../FlexSlotMap'
import { deleteModule } from '../../../step-forms/actions'
import type { ModuleOnDeck } from '../../../step-forms'

vi.mock('../../../step-forms/actions')
vi.mock('../FlexSlotMap')
const render = (props: React.ComponentProps<typeof MultipleModulesRow>) => {
  return renderWithProviders(<MultipleModulesRow {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockTemp: ModuleOnDeck = {
  id: 'temperatureId',
  type: 'temperatureModuleType',
  model: 'temperatureModuleV2',
  slot: 'C3',
  moduleState: {} as any,
}
const mockTemp2: ModuleOnDeck = {
  id: 'temperatureId',
  type: 'temperatureModuleType',
  model: 'temperatureModuleV2',
  slot: 'A1',
  moduleState: {} as any,
}

describe('MultipleModuleRow', () => {
  let props: React.ComponentProps<typeof MultipleModulesRow>
  beforeEach(() => {
    props = {
      moduleType: TEMPERATURE_MODULE_TYPE,
      openEditModuleModal: vi.fn(),
      moduleOnDeckType: TEMPERATURE_MODULE_TYPE,
      moduleOnDeckModel: TEMPERATURE_MODULE_V2,
      moduleOnDeck: [mockTemp, mockTemp2],
    }
    vi.mocked(FlexSlotMap).mockReturnValue(<div>mock FlexSlotMap</div>)
  })
  it('renders 2 modules in the row with text and buttons', () => {
    render(props)
    screen.getByText('Multiple Temperatures')
    screen.getByText('Position:')
    screen.getByText('C3, A1')
    screen.getByText('mock FlexSlotMap')
    fireEvent.click(screen.getByText('edit'))
    expect(props.openEditModuleModal).toHaveBeenCalled()
    fireEvent.click(screen.getByText('remove'))
    expect(vi.mocked(deleteModule)).toHaveBeenCalled()
  })
  it('renders no modules', () => {
    props.moduleOnDeck = undefined
    render(props)
    screen.getByText('add')
  })
})
