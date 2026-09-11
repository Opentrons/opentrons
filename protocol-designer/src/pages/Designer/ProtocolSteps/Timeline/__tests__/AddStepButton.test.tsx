import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
  VACUUM_MODULE_TYPE,
  VACUUM_MODULE_V1,
} from '@opentrons/shared-data'
import { makeContext, makeInitialRobotState } from '@opentrons/step-generation'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { OFFDECK } from '/protocol-designer/constants'
import { getEnableComment } from '/protocol-designer/feature-flags/selectors'
import {
  getInitialRobotState,
  getRobotStateTimeline,
} from '/protocol-designer/file-data/selectors'
import {
  getCurrentFormIsPresaved,
  getInitialDeckSetup,
  getLabwareEntities,
} from '/protocol-designer/step-forms/selectors'
import { getIsMultiSelectMode } from '/protocol-designer/ui/steps'

import { AddStepButton } from '../AddStepButton'

import type { ComponentProps } from 'react'
import type {
  LabwareDefinition2,
  LabwareParameters,
} from '@opentrons/shared-data'
import type { LabwareEntity, RobotState } from '@opentrons/step-generation'

vi.mock('/protocol-designer/feature-flags/selectors')
vi.mock('/protocol-designer/file-data/selectors')
vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('/protocol-designer/ui/steps')

const render = (props: ComponentProps<typeof AddStepButton>) => {
  return renderWithProviders(<AddStepButton {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const MOCK_LID_ID = 'mockLidId'
const MOCK_TIPRACK_ID = 'mockTiprackId'
const MOCK_TUBERACK_ID = 'mockTuberackId'
const MOCK_TIPRACK_ENTITY = {
  id: MOCK_TIPRACK_ID,
  def: {
    parameters: {
      isTiprack: true,
    } as LabwareParameters,
  } as LabwareDefinition2,
} as LabwareEntity
const MOCK_LID_ENTITY = {
  id: MOCK_LID_ID,
  def: {
    allowedRoles: ['lid'],
  } as LabwareDefinition2,
} as LabwareEntity
const MOCK_TIPRACK_LABWARE = {
  stack: [MOCK_TIPRACK_ID, 'C2'],
}
const MOCK_TUBERACK_LABWARE_ONDECK = {
  stack: [MOCK_TUBERACK_ID, 'C2'],
}
const MOCK_TUBERACK_LABWARE_OFFDECK = {
  stack: [MOCK_TUBERACK_ID, OFFDECK],
}

const MOCK_INITIAL_ROBOT_STATE = {
  labware: {
    [MOCK_TIPRACK_ID]: MOCK_TIPRACK_LABWARE,
    [MOCK_TUBERACK_ID]: MOCK_TUBERACK_LABWARE_ONDECK,
  },
  modules: {},
  pipettes: {
    'a212ebf2-bbd7-4946-a0e7-894a55e730ce': {
      mount: 'left',
    },
  },
  liquidState: {
    pipettes: {},
    labware: {},
    trashBins: {},
    wasteChute: {},
  },
  tipState: {
    pipettes: {},
    tipracks: {},
  },
} as RobotState

const MOCK_TUBERACK_ENTITY = {
  labwareDefURI:
    'opentrons/opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical/1',
  id: MOCK_TUBERACK_ID,
  def: {
    parameters: {
      isTiprack: false,
    } as LabwareParameters,
  } as LabwareDefinition2,
} as LabwareEntity

const MOCK_INITIAL_INVARIANT_CONTEXT = makeContext()
const MOCK_INITIAL_DECK_SETUP = makeInitialRobotState({
  invariantContext: MOCK_INITIAL_INVARIANT_CONTEXT,
  labwareLocations: {},
  moduleLocations: {},
  pipetteLocations: {},
})

describe('AddStepButton', () => {
  let props: ComponentProps<typeof AddStepButton>

  beforeEach(() => {
    props = {
      hasText: true,
      sidebarWidth: 10,
    }
    vi.mocked(getEnableComment).mockReturnValue(true)
    vi.mocked(getCurrentFormIsPresaved).mockReturnValue(false)
    vi.mocked(getIsMultiSelectMode).mockReturnValue(false)
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {
        hs: {
          model: HEATERSHAKER_MODULE_V1,
          type: HEATERSHAKER_MODULE_TYPE,
          id: 'mockId',
          moduleState: {} as any,
          slot: 'A1',
          pythonName: 'mockPythonName',
        },
        tc: {
          model: THERMOCYCLER_MODULE_V1,
          type: THERMOCYCLER_MODULE_TYPE,
          id: 'mockId',
          moduleState: {} as any,
          slot: 'B1',
          pythonName: 'mockPythonName',
        },
        temp: {
          model: TEMPERATURE_MODULE_V1,
          type: TEMPERATURE_MODULE_TYPE,
          id: 'mockId',
          moduleState: {} as any,
          slot: 'C1',
          pythonName: 'mockPythonName',
        },
        mag: {
          model: MAGNETIC_MODULE_V1,
          type: MAGNETIC_MODULE_TYPE,
          id: 'mockId',
          moduleState: {} as any,
          slot: 'D1',
          pythonName: 'mockPythonName',
        },
      },
      labware: {},
      additionalEquipmentOnDeck: {
        trash: { id: 'trash', location: 'cutoutA3', name: 'trashBin' },
      },
      pipettes: {},
    })
    vi.mocked(getRobotStateTimeline).mockReturnValue({ timeline: [] })
    vi.mocked(getLabwareEntities).mockReturnValue({
      [MOCK_TIPRACK_ID]: MOCK_TIPRACK_ENTITY,
      [MOCK_TUBERACK_ID]: MOCK_TUBERACK_ENTITY,
    })
    vi.mocked(getInitialRobotState).mockReturnValue(MOCK_INITIAL_ROBOT_STATE)
  })

  it('renders add step button and clicking on it renders the overflow menu with all modules', () => {
    render(props)
    fireEvent.click(screen.getByText('Add Step'))
    screen.getByText('Comment')
    screen.getByText('Transfer')
    screen.getByText('Mix')
    screen.getByText('Pause')
    screen.getByText('Thermocycler')
    screen.getByText('Heater-Shaker')
    screen.getByText('Temperature')
    screen.getByText('Magnet')
    screen.getByText('Camera')
  })

  it('should not render texts if hasText is false', () => {
    props.hasText = false
    render(props)
    const text = screen.queryByText('Add Step')
    expect(text).toBeNull()
  })

  it('should not render liquid handling steps if no compatible labware is present in entities', () => {
    vi.mocked(getLabwareEntities).mockReturnValue({
      [MOCK_TIPRACK_ID]: MOCK_TIPRACK_ENTITY,
    })
    render(props)
    fireEvent.click(screen.getByText('Add Step'))
    screen.getByText('Comment')
    expect(screen.queryByText('Transfer')).not.toBeInTheDocument()
    expect(screen.queryByText('Mix')).not.toBeInTheDocument()
    screen.getByText('Pause')
    screen.getByText('Thermocycler')
    screen.getByText('Heater-Shaker')
    screen.getByText('Temperature')
    screen.getByText('Magnet')
  })

  it('should not render liquid handling steps if only labware has a lid on top in entities', () => {
    vi.mocked(getLabwareEntities).mockReturnValue({
      [MOCK_LID_ID]: MOCK_LID_ENTITY,
    })
    render(props)
    fireEvent.click(screen.getByText('Add Step'))
    screen.getByText('Comment')
    expect(screen.queryByText('Transfer')).not.toBeInTheDocument()
    expect(screen.queryByText('Mix')).not.toBeInTheDocument()
    screen.getByText('Pause')
    screen.getByText('Thermocycler')
    screen.getByText('Heater-Shaker')
    screen.getByText('Temperature')
    screen.getByText('Magnet')
  })

  it('should not render liquid handling steps if no compatible labware on deck', () => {
    vi.mocked(getInitialRobotState).mockReturnValue({
      ...MOCK_INITIAL_ROBOT_STATE,
      labware: {
        ...MOCK_INITIAL_ROBOT_STATE.labware,
        [MOCK_TUBERACK_ID]: MOCK_TUBERACK_LABWARE_OFFDECK,
      },
    })
    render(props)
    fireEvent.click(screen.getByText('Add Step'))
    screen.getByText('Comment')
    expect(screen.queryByText('Transfer')).not.toBeInTheDocument()
    expect(screen.queryByText('Mix')).not.toBeInTheDocument()
    screen.getByText('Pause')
    screen.getByText('Thermocycler')
    screen.getByText('Heater-Shaker')
    screen.getByText('Temperature')
    screen.getByText('Magnet')
  })

  it('should not render vacuum step if vacuum module is not enabled', () => {
    render(props)
    fireEvent.click(screen.getByText('Add Step'))
    expect(screen.queryByText('Vacuum')).not.toBeInTheDocument()
  })

  it('should render vacuum step if vacuum module is enabled', () => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      ...MOCK_INITIAL_DECK_SETUP,
      modules: {
        ...MOCK_INITIAL_DECK_SETUP.modules,
        vacuum: {
          model: VACUUM_MODULE_V1,
          type: VACUUM_MODULE_TYPE,
          id: 'vacuumId',
          moduleState: {} as any,
          slot: 'E1',
          pythonName: 'mockPythonName',
        },
      } as any,
    } as any)
    render(props)
    fireEvent.click(screen.getByText('Add Step'))
    screen.getByText('Vacuum')
  })

  it('should not render vacuum step if vacuum module is not on deck', () => {
    vi.mocked(getInitialRobotState).mockReturnValue(MOCK_INITIAL_ROBOT_STATE)
    render(props)
    fireEvent.click(screen.getByText('Add Step'))
    expect(screen.queryByText('Vacuum')).not.toBeInTheDocument()
  })
})
