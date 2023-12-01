import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders, BaseDeck } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { getSimplestDeckConfigForProtocolCommands } from '../../../resources/deck_configuration/utils'
import { ModulesAndDeckMapViewModal } from '../ModulesAndDeckMapViewModal'

jest.mock('@opentrons/components/src/hardware-sim/BaseDeck')
jest.mock('@opentrons/api-client')
jest.mock('../../../redux/config')
jest.mock('../../Devices/hooks')
jest.mock('../../../resources/deck_configuration/utils')
jest.mock('../../Devices/ModuleInfo')
jest.mock('../../Devices/ProtocolRun/utils/getLabwareRenderInfo')

const mockRunId = 'mockRunId'
const mockSetShowDeckMapModal = jest.fn()
const PROTOCOL_ANALYSIS = {
  id: 'fake analysis',
  status: 'completed',
  labware: [],
} as any

const mockAttachedProtocolModuleMatches = [
  {
    moduleId: 'mockModuleId',
    x: 328,
    y: 107,
    z: 0,
    moduleDef: {
      $otSharedSchema: 'module/schemas/3',
      moduleType: 'magneticBlockType',
      model: 'magneticBlockV1',
      labwareOffset: {
        x: 0,
        y: 0,
        z: 38,
      },
      dimensions: {
        bareOverallHeight: 45,
        overLabwareHeight: 0,
        xDimension: 136,
        yDimension: 94,
        footprintXDimension: 127.75,
        footprintYDimension: 85.75,
        labwareInterfaceXDimension: 128,
        labwareInterfaceYDimension: 86,
      },
      cornerOffsetFromSlot: {
        x: -4.125,
        y: -4.125,
        z: 0,
      },
      calibrationPoint: {
        x: 0,
        y: 0,
        z: 0,
      },
      config: {},
      gripperOffsets: {},
      displayName: 'Magnetic Block GEN1',
      quirks: [],
      slotTransforms: {
        ot2_standard: {},
        ot2_short_trash: {},
        ot3_standard: {},
      },
      compatibleWith: [],
      twoDimensionalRendering: {},
    },
    nestedLabwareDef: null,
    nestedLabwareDisplayName: null,
    nestedLabwareId: null,
    protocolLoadOrder: 0,
    slotName: 'C3',
    attachedModuleMatch: null,
  },
] as any

const render = (
  props: React.ComponentProps<typeof ModulesAndDeckMapViewModal>
) => {
  return renderWithProviders(<ModulesAndDeckMapViewModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockBaseDeck = BaseDeck as jest.MockedFunction<typeof BaseDeck>
const mockGetSimplestDeckConfigForProtocolCommands = getSimplestDeckConfigForProtocolCommands as jest.MockedFunction<
  typeof getSimplestDeckConfigForProtocolCommands
>

describe('ModulesAndDeckMapViewModal', () => {
  let props: React.ComponentProps<typeof ModulesAndDeckMapViewModal>

  beforeEach(() => {
    props = {
      setShowDeckMapModal: mockSetShowDeckMapModal,
      attachedProtocolModuleMatches: mockAttachedProtocolModuleMatches,
      runId: mockRunId,
      protocolAnalysis: PROTOCOL_ANALYSIS,
    }
    when(mockGetSimplestDeckConfigForProtocolCommands).mockReturnValue(
      // TODO(bh, 2023-11-13): mock cutout config protocol spec
      []
    )
    mockBaseDeck.mockReturnValue(<div>mock BaseDeck</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('should render BaseDeck map view', () => {
    const { getByText } = render(props)
    getByText('Map View')
    getByText('mock BaseDeck')
  })
})
