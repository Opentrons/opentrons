import { renderHook } from '@testing-library/react-hooks'
import { when, resetAllWhenMocks } from 'jest-when'

import {
  getPipetteNameSpecs,
  getLoadedLabwareDefinitionsByUri,
  RunTimeCommand,
} from '@opentrons/shared-data'
import { useAllTipLengthCalibrationsQuery } from '@opentrons/react-api-client'
import _tiprack10ul from '@opentrons/shared-data/labware/definitions/2/opentrons_96_tiprack_10ul/1.json'

import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
} from '../../../../redux/calibration/pipette-offset/__fixtures__'
import {
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
} from '../../../../redux/calibration/tip-length/__fixtures__'
import {
  mockLeftProtoPipette,
  mockRightProtoPipette,
} from '../../../../redux/pipettes/__fixtures__'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import {
  useAttachedPipetteCalibrations,
  useAttachedPipettes,
  useRunPipetteInfoByMount,
  useStoredProtocolAnalysis,
} from '..'
import _uncastedModifiedSimpleV6Protocol from '../__fixtures__/modifiedSimpleV6.json'

import type {
  LabwareDefinition2,
  PipetteNameSpecs,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { PipetteInfo } from '..'

jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    getPipetteNameSpecs: jest.fn(),
    getLoadedLabwareDefinitionsByUri: jest.fn(),
  }
})
jest.mock('@opentrons/react-api-client')
jest.mock('../../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
jest.mock('../useAttachedPipetteCalibrations')
jest.mock('../useAttachedPipettes')
jest.mock('../useTipLengthCalibrations')
jest.mock('../useProtocolDetailsForRun')
jest.mock('../useStoredProtocolAnalysis')

const mockGetPipetteNameSpecs = getPipetteNameSpecs as jest.MockedFunction<
  typeof getPipetteNameSpecs
>
const mockUseAttachedPipetteCalibrations = useAttachedPipetteCalibrations as jest.MockedFunction<
  typeof useAttachedPipetteCalibrations
>
const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>
const mockUseAllTipLengthCalibrationsQuery = useAllTipLengthCalibrationsQuery as jest.MockedFunction<
  typeof useAllTipLengthCalibrationsQuery
>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockUseStoredProtocolAnalysis = useStoredProtocolAnalysis as jest.MockedFunction<
  typeof useStoredProtocolAnalysis
>
const mockGetLoadedLabwareDefinitionsByUri = getLoadedLabwareDefinitionsByUri as jest.MockedFunction<
  typeof getLoadedLabwareDefinitionsByUri
>

const PIPETTE_CALIBRATIONS = {
  left: {
    offset: mockPipetteOffsetCalibration1,
    tipLength: mockTipLengthCalibration1,
  },
  right: {
    offset: mockPipetteOffsetCalibration2,
    tipLength: mockTipLengthCalibration2,
  },
}

const ATTACHED_PIPETTES = {
  left: mockLeftProtoPipette,
  right: mockRightProtoPipette,
}

const TIP_LENGTH_CALIBRATIONS = [
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
]

const tiprack10ul = _tiprack10ul as LabwareDefinition2
const modifiedSimpleV6Protocol = ({
  ..._uncastedModifiedSimpleV6Protocol,
  labware: [
    {
      id: ' trashId',
      displayName: 'Trash',
      definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
      loadName: 'opentrons_1_trash_1100ml_fixed',
    },
    {
      id: 'tipRackId',
      displayName: 'Opentrons OT-2 96 Tip Rack 10 µL',
      definitionUri: 'opentrons/opentrons_96_tiprack_10ul/1',
      loadName: 'opentrons_96_tiprack_10ul',
    },
    {
      id: 'sourcePlateId',
      displayName: 'Source Plate',
      definitionUri: 'example/plate/1',
      loadName: 'plate',
    },
    {
      id: 'destPlateId',
      displayName: 'Sample Collection Plate',
      definitionUri: 'example/plate/1',
      loadName: 'plate',
    },
  ],
  pipettes: [
    {
      id: 'pipetteId',
      pipetteName: 'p10_single',
    },
  ],
} as any) as ProtocolAnalysisOutput

const PROTOCOL_DETAILS = {
  displayName: 'fake protocol',
  protocolData: modifiedSimpleV6Protocol,
  protocolKey: 'fakeProtocolKey',
  robotType: 'OT-2 Standard' as const,
}

describe('useRunPipetteInfoByMount hook', () => {
  beforeEach(() => {
    when(mockUseAttachedPipetteCalibrations)
      .calledWith()
      .mockReturnValue(PIPETTE_CALIBRATIONS)
    when(mockUseAttachedPipettes)
      .calledWith()
      .mockReturnValue(ATTACHED_PIPETTES)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith()
      .mockReturnValue({ data: { data: TIP_LENGTH_CALIBRATIONS } } as any)
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith('1')
      .mockReturnValue(PROTOCOL_DETAILS.protocolData as any)
    when(mockUseStoredProtocolAnalysis)
      .calledWith('1')
      .mockReturnValue((PROTOCOL_DETAILS as unknown) as ProtocolAnalysisOutput)
    when(mockGetPipetteNameSpecs)
      .calledWith('p10_single')
      .mockReturnValue({
        displayName: 'P10 Single-Channel GEN1',
      } as PipetteNameSpecs)
    when(mockGetLoadedLabwareDefinitionsByUri)
      .calledWith(
        _uncastedModifiedSimpleV6Protocol.commands as RunTimeCommand[]
      )
      .mockReturnValue(
        _uncastedModifiedSimpleV6Protocol.labwareDefinitions as {}
      )
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return empty mounts when protocol details not found', () => {
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith('1')
      .mockReturnValue(null)
    when(mockUseStoredProtocolAnalysis).calledWith('1').mockReturnValue(null)
    const { result } = renderHook(() => useRunPipetteInfoByMount('1'))
    expect(result.current).toStrictEqual({
      left: null,
      right: null,
    })
  })

  it('should return run pipette info by mount', () => {
    const { result } = renderHook(() => useRunPipetteInfoByMount('1'))
    expect(result.current).toStrictEqual({
      left: ({
        id: 'pipetteId',
        pipetteName: 'p10_single',
        requestedPipetteMatch: 'incompatible',
        pipetteCalDate: null,
        pipetteSpecs: {
          displayName: 'P10 Single-Channel GEN1',
        },
        tipRacksForPipette: [
          {
            displayName: 'Opentrons OT-2 96 Tip Rack 10 µL',
            lastModifiedDate: null,
            tipRackDef: tiprack10ul,
          },
        ],
      } as unknown) as PipetteInfo,
      right: null,
    })
  })
})
