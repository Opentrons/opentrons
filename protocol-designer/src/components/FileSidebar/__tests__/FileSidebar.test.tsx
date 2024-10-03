import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { FLEX_ROBOT_TYPE, fixtureTiprack300ul } from '@opentrons/shared-data'
import { renderWithProviders } from '../../../__testing-utils__'
import { createFile, getRobotType } from '../../../file-data/selectors'
import {
  getCurrentPage,
  getNewProtocolModal,
} from '../../../navigation/selectors'
import { i18n } from '../../../assets/localization'
import {
  getAdditionalEquipment,
  getInitialDeckSetup,
  getSavedStepForms,
} from '../../../step-forms/selectors'
import { toggleNewProtocolModal } from '../../../navigation/actions'
import { getHasUnsavedChanges } from '../../../load-file/selectors'
import { useBlockingHint } from '../../Hints/useBlockingHint'
import { getUnusedStagingAreas } from '../utils/getUnusedStagingAreas'
import { getUnusedTrash } from '../utils/getUnusedTrash'
import { FileSidebar } from '../FileSidebar'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../../../step-forms/selectors')
vi.mock('../../../load-file/selectors')
vi.mock('../../../navigation/actions')
vi.mock('../../../navigation/selectors')
vi.mock('../../../file-data/selectors')
vi.mock('../../Hints/useBlockingHint')
vi.mock('../utils/getUnusedStagingAreas')
vi.mock('../utils/getUnusedTrash')
const render = () => {
  return renderWithProviders(<FileSidebar />, { i18nInstance: i18n })[0]
}

describe('FileSidebar', () => {
  beforeEach(() => {
    vi.mocked(getUnusedStagingAreas).mockReturnValue([])
    vi.mocked(getUnusedTrash).mockReturnValue({
      trashBinUnused: false,
      wasteChuteUnused: false,
    })
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {},
      pipettes: {},
      additionalEquipmentOnDeck: {},
      labware: {},
    })
    vi.mocked(getHasUnsavedChanges).mockReturnValue(false)
    vi.mocked(getNewProtocolModal).mockReturnValue(false)
    vi.mocked(getSavedStepForms).mockReturnValue({})
    vi.mocked(getAdditionalEquipment).mockReturnValue({})
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
    vi.mocked(getCurrentPage).mockReturnValue('settings-app')
    vi.mocked(useBlockingHint).mockReturnValue(null)
    vi.mocked(createFile).mockReturnValue({
      commands: [
        {
          commandType: 'moveToAddressableArea',
          params: {
            addressableAreaName: 'movableTrashA3',
            pipetteId: 'mockId',
            offset: { x: 0, y: 0, z: 0 },
          },
        },
      ],
    } as any)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('renders the file sidebar and exports with blocking hint for exporting', () => {
    vi.mocked(useBlockingHint).mockReturnValue(<div>mock blocking hint</div>)
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    expect(vi.mocked(useBlockingHint)).toHaveBeenCalled()
    screen.getByText('mock blocking hint')
  })
  it('renders the file sidebar and buttons work as expected with no warning upon export', () => {
    render()
    screen.getByText('Protocol File')
    fireEvent.click(screen.getByRole('button', { name: 'Create New' }))
    expect(vi.mocked(toggleNewProtocolModal)).toHaveBeenCalled()
    screen.getByText('Import')
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    expect(vi.mocked(useBlockingHint)).toHaveBeenCalled()
  })
  it('renders the no commands warning', () => {
    vi.mocked(createFile).mockReturnValue({
      commands: [],
    } as any)
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Your protocol has no steps')
  })
  it('renders the unused pipette warning', () => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {},
      pipettes: {
        pipetteId: {
          mount: 'left',
          name: 'p1000_96',
          id: 'pipetteId',
          tiprackLabwareDef: [fixtureTiprack300ul as LabwareDefinition2],
          tiprackDefURI: ['mockDefUri'],
          spec: {
            displayName: 'mock display name',
          } as any,
        },
      },
      additionalEquipmentOnDeck: {},
      labware: {},
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Unused pipette')
  })
  it('renders the unused pieptte and module warning', () => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {
        moduleId: {
          slot: 'A1',
          moduleState: {} as any,
          id: 'moduleId',
          type: 'temperatureModuleType',
          model: 'temperatureModuleV2',
        },
      },
      pipettes: {
        pipetteId: {
          mount: 'left',
          name: 'p1000_96',
          id: 'pipetteId',
          tiprackLabwareDef: [fixtureTiprack300ul as LabwareDefinition2],
          tiprackDefURI: ['mockDefUri'],
          spec: {
            displayName: 'mock display name',
          } as any,
        },
      },
      additionalEquipmentOnDeck: {},
      labware: {},
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Unused pipette and module')
  })
  it('renders the unused trash warning', () => {
    vi.mocked(getUnusedTrash).mockReturnValue({
      trashBinUnused: true,
      wasteChuteUnused: false,
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Unused trash')
  })
  it('renders the unused waste chute warning', () => {
    vi.mocked(getUnusedTrash).mockReturnValue({
      trashBinUnused: false,
      wasteChuteUnused: true,
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Unused trash')
  })
  it('renders the unused staging area slot warning', () => {
    vi.mocked(getUnusedStagingAreas).mockReturnValue(['D4'])
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('One or more staging area slots are unused')
  })
  it('renders the unused gripper warning', () => {
    vi.mocked(getAdditionalEquipment).mockReturnValue({
      gripperId: { name: 'gripper', id: 'gripperId' },
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Unused gripper')
  })
  it('renders the unused module warning', () => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {
        moduleId: {
          slot: 'A1',
          moduleState: {} as any,
          id: 'moduleId',
          type: 'temperatureModuleType',
          model: 'temperatureModuleV2',
        },
      },
      pipettes: {},
      additionalEquipmentOnDeck: {},
      labware: {},
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Unused module')
    screen.getByText(
      'The Temperature module specified in your protocol in Slot A1 is not currently used in any step. In order to run this protocol you will need to power up and connect the module to your robot.'
    )
  })
  it('renders the unused modules warning', () => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {
        moduleId: {
          slot: 'A1',
          moduleState: {} as any,
          id: 'moduleId',
          type: 'temperatureModuleType',
          model: 'temperatureModuleV2',
        },
        moduleId2: {
          slot: 'B1',
          moduleState: {} as any,
          id: 'moduleId2',
          type: 'temperatureModuleType',
          model: 'temperatureModuleV2',
        },
      },
      pipettes: {},
      additionalEquipmentOnDeck: {},
      labware: {},
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Unused modules')
    screen.getByText(
      'One or more modules specified in your protocol in Slot(s) A1,B1 are not currently used in any step. In order to run this protocol you will need to power up and connect the modules to your robot.'
    )
  })
  it('renders the formatted unused pipettes and modules warning sorted by count', () => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {
        moduleId1: {
          slot: 'A1',
          moduleState: {} as any,
          id: 'moduleId',
          type: 'thermocyclerModuleType',
          model: 'thermocyclerModuleV2',
        },
        moduleId2: {
          slot: 'C3',
          moduleState: {} as any,
          id: 'moduleId1',
          type: 'temperatureModuleType',
          model: 'temperatureModuleV2',
        },
        moduleId3: {
          slot: 'D3',
          moduleState: {} as any,
          id: 'moduleId2',
          type: 'temperatureModuleType',
          model: 'temperatureModuleV2',
        },
        moduleId4: {
          slot: 'C1',
          moduleState: {} as any,
          id: 'moduleId3',
          type: 'heaterShakerModuleType',
          model: 'heaterShakerModuleV1',
        },
      },
      pipettes: {
        pipetteId: {
          mount: 'left',
          name: 'p1000_96',
          id: 'pipetteId',
          tiprackLabwareDef: [fixtureTiprack300ul as LabwareDefinition2],
          tiprackDefURI: ['mockDefUri'],
          spec: {
            displayName: 'mock display name',
            channels: 96,
          } as any,
        },
      },
      additionalEquipmentOnDeck: {},
      labware: {},
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText(
      'The mock display name pipette and Temperature modules, Thermocycler module, and Heater-Shaker module in your protocol are not currently used in any step. In order to run this protocol you will need to attach this pipette as well as power up and connect the module to your robot.'
    )
  })
})
