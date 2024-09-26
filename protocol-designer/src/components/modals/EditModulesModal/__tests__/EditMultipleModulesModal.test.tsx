import type * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { getInitialDeckSetup } from '../../../../step-forms/selectors'
import { getLabwareIsCompatible } from '../../../../utils/labwareModuleCompatibility'
import { getLabwareOnSlot, getSlotIsEmpty } from '../../../../step-forms'
import { EditMultipleModulesModal } from '../EditMultipleModulesModal'
import type * as Components from '@opentrons/components'
import type { ModuleOnDeck } from '../../../../step-forms'

vi.mock('../../../../step-forms/selectors')
vi.mock('../../../../utils/labwareModuleCompatibility')
vi.mock('../../../../step-forms')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof Components>()
  return {
    ...actual,
    DeckConfigurator: vi.fn(() => <div>mock deck config</div>),
  }
})

const render = (
  props: React.ComponentProps<typeof EditMultipleModulesModal>
) => {
  return renderWithProviders(<EditMultipleModulesModal {...props} />, {
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
const mockHS: ModuleOnDeck = {
  id: 'heaterShakerId',
  type: 'heaterShakerModuleType',
  model: 'heaterShakerModuleV1',
  moduleState: {} as any,
  slot: 'A1',
}
describe('EditMultipleModulesModal', () => {
  let props: React.ComponentProps<typeof EditMultipleModulesModal>
  beforeEach(() => {
    props = {
      moduleType: 'temperatureModuleType',
      onCloseClick: vi.fn(),
      allModulesOnDeck: [mockTemp, mockTemp2],
    }
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {
        temperatureId: mockTemp,
        temperatureId2: mockTemp2,
      },
      labware: {},
      additionalEquipmentOnDeck: {},
      pipettes: {},
    })
    vi.mocked(getLabwareOnSlot).mockReturnValue(null)
    vi.mocked(getSlotIsEmpty).mockReturnValue(true)
  })
  it('renders modal and buttons with no error', () => {
    vi.mocked(getLabwareIsCompatible).mockReturnValue(true)
    render(props)
    screen.getByText('mock deck config')
    screen.getByText('Multiple Temperatures')
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }))
    expect(props.onCloseClick).toHaveBeenCalled()
    screen.getByRole('button', { name: 'save' })
  })
  it('renders modal with a cannot place module error', () => {
    vi.mocked(getLabwareOnSlot).mockReturnValue({ slot: 'A1' } as any)
    vi.mocked(getLabwareIsCompatible).mockReturnValue(false)
    vi.mocked(getSlotIsEmpty).mockReturnValue(false)
    props.allModulesOnDeck = [mockTemp, mockTemp2, mockHS]
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {
        heaterShakerId: mockHS,
      },
      labware: {},
      additionalEquipmentOnDeck: {},
      pipettes: {},
    })
    render(props)
    screen.getByText('warning')
    screen.getByText('Cannot place module')
    screen.getByText('Multiple slots are occupied')
  })
})
