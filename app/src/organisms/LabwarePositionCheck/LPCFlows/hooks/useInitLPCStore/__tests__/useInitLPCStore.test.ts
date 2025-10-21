import { useDispatch, useSelector } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { sortRunRecordOffsets } from '/app/organisms/LabwarePositionCheck/LPCFlows/hooks/useInitLPCStore/sortRunRecordOffsets'
import { getActivePipetteId } from '/app/organisms/LabwarePositionCheck/LPCFlows/hooks/utils'
import {
  LPC_STEPS,
  OFFSETS_SOURCE_INITIALIZING,
  updateLPC,
} from '/app/redux/protocol-runs'

import { useInitLPCStore } from '..'

vi.mock('react-redux')
vi.mock('/app/redux/protocol-runs')
vi.mock('/app/organisms/LabwarePositionCheck/LPCFlows/hooks/utils')
vi.mock(
  '/app/organisms/LabwarePositionCheck/LPCFlows/hooks/useInitLPCStore/sortRunRecordOffsets'
)

describe('useInitLPCStore', () => {
  const RUN_ID = 'run-123'
  const MAINTENANCE_RUN_ID = 'maintenance-run-456'
  const PROTOCOL_NAME = 'Test Protocol'
  const ACTIVE_PIPETTE_ID = 'pipette-789'

  const MOCK_DISPATCH = vi.fn()
  const MOCK_LABWARE_DEFS = [{ metadata: { displayName: 'Labware 1' } }] as any
  const MOCK_LABWARE_INFO = {
    labware: {},
    areOffsetsApplied: false,
    selectedLabware: null,
    initialRunRecordOffsets: [],
    initialDatabaseOffsets: [],
    conflictTimestampInfo: { timestamp: null, isInitialized: false },
    sourcedOffsets: 'initializing',
  }
  const MOCK_DECK_CONFIG = { deck_def: {} } as any
  const MOCK_ANALYSIS = {
    pipettes: [{ id: ACTIVE_PIPETTE_ID, mount: 'left' }],
  } as any
  const MOCK_RUN_RECORD = {
    data: {
      labwareOffsets: [{ id: 'offset-1' }],
    },
  } as any
  const MOCK_STORED_OFFSETS = [{ id: 'stored-offset-1' }] as any

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useDispatch).mockReturnValue(MOCK_DISPATCH)
    vi.mocked(useSelector).mockReturnValue(null)
    vi.mocked(getActivePipetteId).mockReturnValue(ACTIVE_PIPETTE_ID)
    vi.mocked(sortRunRecordOffsets).mockImplementation(offsets => offsets)

    vi.mocked(updateLPC).mockImplementation((runId, state) => ({
      type: 'UPDATE_LPC',
      payload: { runId, state },
    }))
  })

  it('should not dispatch updateLPC when lpcState already exists', () => {
    vi.mocked(useSelector).mockReturnValue({})

    renderHook(() => {
      useInitLPCStore({
        runId: RUN_ID,
        isFlex: true,
        analysis: MOCK_ANALYSIS,
        protocolName: PROTOCOL_NAME,
        deckConfig: MOCK_DECK_CONFIG,
        maintenanceRunId: MAINTENANCE_RUN_ID,
        labwareDefs: MOCK_LABWARE_DEFS,
        labwareInfo: MOCK_LABWARE_INFO,
        runRecord: MOCK_RUN_RECORD,
        flexStoredOffsets: MOCK_STORED_OFFSETS,
      } as any)
    })

    expect(MOCK_DISPATCH).not.toHaveBeenCalled()
  })

  it('should not dispatch updateLPC when runId is null', () => {
    renderHook(() => {
      useInitLPCStore({
        runId: null,
        analysis: MOCK_ANALYSIS,
        protocolName: PROTOCOL_NAME,
        deckConfig: MOCK_DECK_CONFIG,
        maintenanceRunId: MAINTENANCE_RUN_ID,
        labwareDefs: MOCK_LABWARE_DEFS,
        labwareInfo: MOCK_LABWARE_INFO,
        runRecord: MOCK_RUN_RECORD,
        flexStoredOffsets: MOCK_STORED_OFFSETS,
      } as any)
    })

    expect(MOCK_DISPATCH).not.toHaveBeenCalled()
  })

  it('should not dispatch updateLPC when analysis is null', () => {
    renderHook(() => {
      useInitLPCStore({
        runId: RUN_ID,
        analysis: null,
        protocolName: PROTOCOL_NAME,
        deckConfig: MOCK_DECK_CONFIG,
        maintenanceRunId: MAINTENANCE_RUN_ID,
        labwareDefs: MOCK_LABWARE_DEFS,
        labwareInfo: MOCK_LABWARE_INFO,
        runRecord: MOCK_RUN_RECORD,
        flexStoredOffsets: MOCK_STORED_OFFSETS,
      } as any)
    })

    expect(MOCK_DISPATCH).not.toHaveBeenCalled()
  })

  it('should not dispatch updateLPC when protocolName is undefined', () => {
    renderHook(() => {
      useInitLPCStore({
        runId: RUN_ID,
        analysis: MOCK_ANALYSIS,
        protocolName: undefined,
        deckConfig: MOCK_DECK_CONFIG,
        maintenanceRunId: MAINTENANCE_RUN_ID,
        labwareDefs: MOCK_LABWARE_DEFS,
        labwareInfo: MOCK_LABWARE_INFO,
        runRecord: MOCK_RUN_RECORD,
        flexStoredOffsets: MOCK_STORED_OFFSETS,
      } as any)
    })

    expect(MOCK_DISPATCH).not.toHaveBeenCalled()
  })

  it('should not dispatch updateLPC when deckConfig is undefined', () => {
    renderHook(() => {
      useInitLPCStore({
        runId: RUN_ID,
        analysis: MOCK_ANALYSIS,
        protocolName: PROTOCOL_NAME,
        deckConfig: undefined,
        maintenanceRunId: MAINTENANCE_RUN_ID,
        labwareDefs: MOCK_LABWARE_DEFS,
        labwareInfo: MOCK_LABWARE_INFO,
        runRecord: MOCK_RUN_RECORD,
        flexStoredOffsets: MOCK_STORED_OFFSETS,
      } as any)
    })

    expect(MOCK_DISPATCH).not.toHaveBeenCalled()
  })

  it('should not dispatch updateLPC when flexStoredOffsets is undefined', () => {
    renderHook(() => {
      useInitLPCStore({
        runId: RUN_ID,
        analysis: MOCK_ANALYSIS,
        protocolName: PROTOCOL_NAME,
        deckConfig: MOCK_DECK_CONFIG,
        maintenanceRunId: MAINTENANCE_RUN_ID,
        labwareDefs: MOCK_LABWARE_DEFS,
        labwareInfo: MOCK_LABWARE_INFO,
        runRecord: MOCK_RUN_RECORD,
        flexStoredOffsets: undefined,
      } as any)
    })

    expect(MOCK_DISPATCH).not.toHaveBeenCalled()
  })

  it('should not dispatch updateLPC when runRecord lacks labwareOffsets', () => {
    renderHook(() => {
      useInitLPCStore({
        runId: RUN_ID,
        analysis: MOCK_ANALYSIS,
        protocolName: PROTOCOL_NAME,
        deckConfig: MOCK_DECK_CONFIG,
        maintenanceRunId: MAINTENANCE_RUN_ID,
        labwareDefs: MOCK_LABWARE_DEFS,
        labwareInfo: MOCK_LABWARE_INFO,
        runRecord: { data: {} } as any,
        flexStoredOffsets: MOCK_STORED_OFFSETS,
      } as any)
    })

    expect(MOCK_DISPATCH).not.toHaveBeenCalled()
  })

  it('should not dispatch updateLPC for OT2 robot type', () => {
    renderHook(() => {
      useInitLPCStore({
        runId: RUN_ID,
        analysis: MOCK_ANALYSIS,
        protocolName: PROTOCOL_NAME,
        deckConfig: MOCK_DECK_CONFIG,
        maintenanceRunId: MAINTENANCE_RUN_ID,
        labwareDefs: MOCK_LABWARE_DEFS,
        labwareInfo: MOCK_LABWARE_INFO,
        runRecord: MOCK_RUN_RECORD,
        robotType: OT2_ROBOT_TYPE,
        flexStoredOffsets: MOCK_STORED_OFFSETS,
      } as any)
    })

    expect(MOCK_DISPATCH).not.toHaveBeenCalled()
  })

  it('should dispatch updateLPC when all required conditions are met for the Flex', () => {
    renderHook(() => {
      useInitLPCStore({
        runId: RUN_ID,
        isFlex: true,
        analysis: MOCK_ANALYSIS,
        protocolName: PROTOCOL_NAME,
        deckConfig: MOCK_DECK_CONFIG,
        maintenanceRunId: MAINTENANCE_RUN_ID,
        labwareDefs: MOCK_LABWARE_DEFS,
        labwareInfo: MOCK_LABWARE_INFO,
        runRecord: MOCK_RUN_RECORD,
        flexStoredOffsets: MOCK_STORED_OFFSETS,
      } as any)
    })

    expect(MOCK_DISPATCH).toHaveBeenCalledTimes(1)
    expect(updateLPC).toHaveBeenCalledWith(RUN_ID, {
      protocolData: MOCK_ANALYSIS,
      labwareDefs: MOCK_LABWARE_DEFS,
      activePipetteId: ACTIVE_PIPETTE_ID,
      protocolName: PROTOCOL_NAME,
      deckConfig: MOCK_DECK_CONFIG,
      maintenanceRunId: MAINTENANCE_RUN_ID,
      labwareInfo: {
        ...MOCK_LABWARE_INFO,
        sourcedOffsets: OFFSETS_SOURCE_INITIALIZING,
        initialRunRecordOffsets: MOCK_RUN_RECORD.data.labwareOffsets,
        initialDatabaseOffsets: MOCK_STORED_OFFSETS,
      },
      steps: {
        currentStepIndex: 0,
        totalStepCount: LPC_STEPS.length,
        all: LPC_STEPS,
        lastStepIndices: null,
        currentSubstep: null,
      },
      ui: { showDefaultOffsetInfoBanner: true, showSnackbar: null },
    })
    expect(sortRunRecordOffsets).toHaveBeenCalledWith(
      MOCK_RUN_RECORD.data.labwareOffsets
    )
  })

  it('should use NO_PIPETTE when no active pipette is found', () => {
    vi.mocked(getActivePipetteId).mockReturnValue(null)

    renderHook(() => {
      useInitLPCStore({
        runId: RUN_ID,
        isFlex: true,
        analysis: MOCK_ANALYSIS,
        protocolName: PROTOCOL_NAME,
        deckConfig: MOCK_DECK_CONFIG,
        maintenanceRunId: MAINTENANCE_RUN_ID,
        labwareDefs: MOCK_LABWARE_DEFS,
        labwareInfo: MOCK_LABWARE_INFO,
        runRecord: MOCK_RUN_RECORD,
        flexStoredOffsets: MOCK_STORED_OFFSETS,
      } as any)
    })

    expect(MOCK_DISPATCH).toHaveBeenCalledTimes(1)
    expect(updateLPC).toHaveBeenCalledWith(
      RUN_ID,
      expect.objectContaining({
        activePipetteId: 'NO_PIPETTE',
      })
    )
  })
})
