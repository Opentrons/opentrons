import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'

import {
  fixtureP1000SingleV2Specs,
  fixtureTiprack1000ul,
  FLEX_ROBOT_TYPE,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { SelectLabwareModal } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { getRobotType } from '../../../../file-data/selectors'
import { createCustomLabwareDef } from '../../../../labware-defs/actions'
import { getCustomLabwareDefsByURI } from '../../../../labware-defs/selectors'
import {
  selectLabware,
  selectNestedLabware,
} from '../../../../labware-ingred/actions'
import { selectors } from '../../../../labware-ingred/selectors'
import {
  getInitialDeckSetup,
  getPermittedTipracks,
  getPipetteEntities,
} from '../../../../step-forms/selectors'
import { getHas96Channel } from '../../../../utils'

import type { ComponentProps } from 'react'
import type { LabwareDefinition2, PipetteV2Specs } from '@opentrons/shared-data'

vi.mock('../../../../step-forms/selectors')
vi.mock('../../../../utils')
vi.mock('../../../../labware-ingred/selectors')
vi.mock('../../../../labware-defs/selectors')
vi.mock('../../../../labware-defs/actions')
vi.mock('../../../../file-data/selectors')
vi.mock('../../../../labware-ingred/actions')
const render = (props: ComponentProps<typeof SelectLabwareModal>) => {
  return renderWithProviders(<SelectLabwareModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('SelectLabwareModal', () => {
  let props: ComponentProps<typeof SelectLabwareModal>

  beforeEach(() => {
    props = {
      slot: 'D3',
      onClose: vi.fn(),
      onConfirm: vi.fn(),
    }
    vi.mocked(getCustomLabwareDefsByURI).mockReturnValue({})
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
    vi.mocked(getPermittedTipracks).mockReturnValue([])
    vi.mocked(getPipetteEntities).mockReturnValue({
      pip: {
        tiprackDefURI: ['mockTipUri'],
        spec: fixtureP1000SingleV2Specs as PipetteV2Specs,
        name: 'p1000_single_flex',
        id: 'mockPipId',
        tiprackLabwareDef: [fixtureTiprack1000ul as LabwareDefinition2],
        pythonName: 'mockPythonName',
      },
    })
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedLabwareDefUri: null,
      selectedNestedLabwareDefUri: null,
      selectedFixture: null,
      selectedModuleModel: null,
      selectedSlot: { slot: 'D3', cutout: 'cutoutD3' },
    })
    vi.mocked(getHas96Channel).mockReturnValue(false)
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {},
      labware: {},
      pipettes: {},
      additionalEquipmentOnDeck: {},
    })
  })

  it('renders an empty slot with all the labware options', () => {
    render(props)
    screen.getAllByText('Add labware')
    screen.getByText('Tube racks')
    screen.getByText('Well plates')
    screen.getByText('Reservoirs')
    screen.getByText('Aluminum blocks')
    screen.getByText('Adapters')
    //  click and expand reservoirs accordion
    fireEvent.click(screen.getAllByTestId('ListButton_noActive')[3])
    fireEvent.click(
      screen.getByText('Opentrons Calibration Block - Short Side: Left')
    )
    expect(vi.mocked(selectLabware)).toHaveBeenCalled()
  })
  it('renders deck slot and selects an adapter and labware', () => {
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedLabwareDefUri: 'fixture/fixture_universal_flat_bottom_adapter/1',
      selectedNestedLabwareDefUri: null,
      selectedFixture: null,
      selectedModuleModel: null,
      selectedSlot: { slot: 'D3', cutout: 'cutoutD3' },
    })
    render(props)
    screen.getByText('Adapters')
    fireEvent.click(screen.getAllByTestId('ListButton_noActive')[4])
    //   set adapter
    screen.getByText('Adapter compatible labware')
    fireEvent.click(
      screen.getByText('Fixture Corning 96 Well Plate 360 µL Flat')
    )
    expect(vi.mocked(selectNestedLabware)).toHaveBeenCalled()
  })

  it('renders the custom labware flow', () => {
    render(props)
    screen.getByText('Upload custom labware')
    fireEvent.change(screen.getByTestId('customLabwareInput'))
    expect(vi.mocked(createCustomLabwareDef)).toHaveBeenCalled()
  })

  it('renders the filter checkbox if there is a module on the slot and is checked by default', () => {
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedLabwareDefUri: null,
      selectedNestedLabwareDefUri: null,
      selectedFixture: null,
      selectedModuleModel: THERMOCYCLER_MODULE_V1,
      selectedSlot: { slot: 'B1', cutout: 'cutoutB1' },
    })
    render(props)
    screen.getByText('Only display recommended labware')
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
})
