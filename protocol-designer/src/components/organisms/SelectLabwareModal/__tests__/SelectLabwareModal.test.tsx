import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'

import {
  fixtureP1000SingleV2Specs,
  fixtureTiprack1000ul,
  FLEX_ROBOT_TYPE,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import { createCustomLabwareDef } from '/protocol-designer/labware-defs/actions'
import { getCustomLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'
import { selectTopLabware } from '/protocol-designer/labware-ingred/actions'
import { selectors } from '/protocol-designer/labware-ingred/selectors'
import {
  getInitialDeckSetup,
  getPermittedTipracks,
  getPipetteEntities,
} from '/protocol-designer/step-forms/selectors'
import { getHas96Channel } from '/protocol-designer/utils'

import { SelectLabwareModal } from '..'

import type { ComponentProps } from 'react'
import type { InfoScreen } from '@opentrons/components'
import type { LabwareDefinition2, PipetteV2Specs } from '@opentrons/shared-data'

vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('/protocol-designer/utils')
vi.mock('/protocol-designer/labware-ingred/selectors')
vi.mock('/protocol-designer/labware-defs/selectors')
vi.mock('/protocol-designer/labware-defs/actions')
vi.mock('/protocol-designer/file-data/selectors')
vi.mock('/protocol-designer/labware-ingred/actions')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof InfoScreen>()
  return {
    ...actual,
    InfoScreen: vi.fn(() => <div>mock InfoScreen</div>),
  }
})

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
      slotFull: false,
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
      selectedTopLabware: { labwareDefURI: null, amount: 1 },
      selectedLidLabware: null,
      selectedAdapterDefURI: null,
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

  // Note temporarily skip
  it.skip('renders an empty slot with all the labware options', () => {
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
    expect(vi.mocked(selectTopLabware)).toHaveBeenCalled()
  })

  // Note temporarily skip
  it.skip('renders deck slot and selects an adapter and labware', () => {
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedAdapterDefURI: 'fixture/fixture_universal_flat_bottom_adapter/1',
      selectedTopLabware: { labwareDefURI: null, amount: 1 },
      selectedLidLabware: null,
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
    expect(vi.mocked(selectTopLabware)).toHaveBeenCalled()
  })

  it('renders the custom labware flow', () => {
    render(props)
    fireEvent.change(screen.getByLabelText('Upload custom labware'), {
      target: {
        files: [
          new File(['{}'], 'custom-labware.json', {
            type: 'application/json',
          }),
        ],
      },
    })
    expect(vi.mocked(createCustomLabwareDef)).toHaveBeenCalled()
  })

  it('renders the filter checkbox if there is a module on the slot and is checked by default', () => {
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedAdapterDefURI: null,
      selectedTopLabware: { labwareDefURI: null, amount: 1 },
      selectedLidLabware: null,
      selectedFixture: null,
      selectedModuleModel: THERMOCYCLER_MODULE_V1,
      selectedSlot: { slot: 'B1', cutout: 'cutoutB1' },
    })
    render(props)
    screen.getByText('Only display recommended labware')
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('renders infoscreen component if slot is full', () => {
    props.slotFull = true
    render(props)
    screen.getByText('mock InfoScreen')
    expect(screen.queryByText('Upload custom labware')).not.toBeInTheDocument()
  })
})
