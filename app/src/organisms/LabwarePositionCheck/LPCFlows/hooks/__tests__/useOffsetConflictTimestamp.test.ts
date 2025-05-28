import { useDispatch, useSelector } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  selectAreOffsetsApplied,
  selectConflictTimestampInfo,
  selectInitialDatabaseOffsets,
  selectInitialRunRecordOffsets,
  updateConflictTimestamp,
} from '/app/redux/protocol-runs'
import { useNotifyAllRunsQuery } from '/app/resources/runs'

import { useOffsetConflictTimestamp } from '../useOffsetConflictTimestamp'

import type {
  ANY_LOCATION,
  LabwareOffset,
  Run,
  StoredLabwareOffset,
} from '@opentrons/api-client'

vi.mock('react-redux')
vi.mock('/app/resources/runs')
vi.mock('/app/redux/protocol-runs')

describe('useOffsetConflictTimestamp', () => {
  const RUN_ID = 'run-123'
  const PROTOCOL_ID = 'protocol-456'
  const CREATED_AT = '2024-03-15T12:00:00Z'
  const LABWARE_URI = 'opentrons/labware-1'

  const mockDispatch = vi.fn()
  const mockState = {
    protocolRuns: {
      [RUN_ID]: {
        lpc: {},
      },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: {
        data: [],
      },
    } as any)

    vi.mocked(updateConflictTimestamp).mockReturnValue({
      type: 'UPDATE_CONFLICT_TIMESTAMP',
    } as any)

    vi.mocked(
      selectAreOffsetsApplied
    ).mockImplementation((runId: string) => (state: any) => false)

    vi.mocked(selectConflictTimestampInfo).mockImplementation(
      (runId: string) => (state: any) => ({
        isInitialized: false,
        timestamp: null,
      })
    )

    vi.mocked(
      selectInitialRunRecordOffsets
    ).mockImplementation((runId: string) => (state: any) => [])

    vi.mocked(
      selectInitialDatabaseOffsets
    ).mockImplementation((runId: string) => (state: any) => [])

    vi.mocked(useSelector).mockImplementation(selector => {
      if (typeof selector === 'function') {
        return selector(mockState)
      }
      return null
    })
  })

  it('should do nothing when isFlex is false', () => {
    renderHook(() => {
      useOffsetConflictTimestamp(false, RUN_ID, {
        data: { protocolId: PROTOCOL_ID },
      } as Run)
    })

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should do nothing when conflict info is already initialized', () => {
    vi.mocked(selectConflictTimestampInfo).mockImplementation(
      (runId: string) => (state: any) => ({
        isInitialized: true,
        timestamp: null,
      })
    )

    renderHook(() => {
      useOffsetConflictTimestamp(true, RUN_ID, {
        data: { protocolId: PROTOCOL_ID },
      } as Run)
    })

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should do nothing when in initializing state', () => {
    renderHook(() => {
      useOffsetConflictTimestamp(true, null, undefined)
    })

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should do nothing when offsets are already applied', () => {
    vi.mocked(
      selectAreOffsetsApplied
    ).mockImplementation((runId: string) => (state: any) => true)

    renderHook(() => {
      useOffsetConflictTimestamp(true, RUN_ID, {
        data: { protocolId: PROTOCOL_ID },
      } as Run)
    })

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should set timestamp to null when no outdated offsets exist', () => {
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: {
        data: [
          { current: false, protocolId: PROTOCOL_ID, createdAt: CREATED_AT },
        ],
      },
    } as any)

    const runRecordOffset: LabwareOffset = {
      id: 'offset-1',
      createdAt: CREATED_AT,
      definitionUri: LABWARE_URI,
      location: { slotName: 'A1' },
      vector: { x: 1, y: 2, z: 3 },
    }

    const databaseOffset: StoredLabwareOffset = {
      id: 'stored-offset-1',
      createdAt: CREATED_AT,
      definitionUri: LABWARE_URI,
      locationSequence: [
        { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      ],
      vector: { x: 1, y: 2, z: 3 },
    }

    vi.mocked(
      selectInitialRunRecordOffsets
    ).mockImplementation((runId: string) => (state: any) => [runRecordOffset])

    vi.mocked(
      selectInitialDatabaseOffsets
    ).mockImplementation((runId: string) => (state: any) => [databaseOffset])

    renderHook(() => {
      useOffsetConflictTimestamp(true, RUN_ID, {
        data: { protocolId: PROTOCOL_ID },
      } as Run)
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      updateConflictTimestamp(RUN_ID, { isInitialized: true, timestamp: null })
    )
  })

  it('should set timestamp when location-specific offset is outdated', () => {
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: {
        data: [
          { current: false, protocolId: PROTOCOL_ID, createdAt: CREATED_AT },
        ],
      },
    } as any)

    const runRecordOffset: LabwareOffset = {
      id: 'offset-1',
      createdAt: CREATED_AT,
      definitionUri: LABWARE_URI,
      location: { slotName: 'A1' },
      locationSequence: [
        { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      ],
      vector: { x: 1, y: 2, z: 3 },
    }

    const databaseOffset: StoredLabwareOffset = {
      id: 'stored-offset-1',
      createdAt: CREATED_AT,
      definitionUri: LABWARE_URI,
      locationSequence: [
        { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      ],
      vector: { x: 4, y: 5, z: 6 },
    }

    vi.mocked(
      selectInitialRunRecordOffsets
    ).mockImplementation((runId: string) => (state: any) => [runRecordOffset])

    vi.mocked(
      selectInitialDatabaseOffsets
    ).mockImplementation((runId: string) => (state: any) => [databaseOffset])

    renderHook(() => {
      useOffsetConflictTimestamp(true, RUN_ID, {
        data: { protocolId: PROTOCOL_ID },
      } as Run)
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      updateConflictTimestamp(RUN_ID, {
        isInitialized: true,
        timestamp: CREATED_AT,
      })
    )
  })

  it('should set timestamp when default offset is outdated', () => {
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: {
        data: [
          { current: false, protocolId: PROTOCOL_ID, createdAt: CREATED_AT },
        ],
      },
    } as any)

    const runRecordOffset: LabwareOffset = {
      id: 'offset-1',
      createdAt: CREATED_AT,
      definitionUri: LABWARE_URI,
      location: { slotName: 'A1' },
      vector: { x: 1, y: 2, z: 3 },
    }

    const defaultDatabaseOffset: StoredLabwareOffset = {
      id: 'default-offset-1',
      createdAt: CREATED_AT,
      definitionUri: LABWARE_URI,
      locationSequence: 'anyLocation' as typeof ANY_LOCATION,
      vector: { x: 4, y: 5, z: 6 },
    }

    vi.mocked(
      selectInitialRunRecordOffsets
    ).mockImplementation((runId: string) => (state: any) => [runRecordOffset])

    vi.mocked(
      selectInitialDatabaseOffsets
    ).mockImplementation((runId: string) => (state: any) => [
      defaultDatabaseOffset,
    ])

    renderHook(() => {
      useOffsetConflictTimestamp(true, RUN_ID, {
        data: { protocolId: PROTOCOL_ID },
      } as Run)
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      updateConflictTimestamp(RUN_ID, {
        isInitialized: true,
        timestamp: CREATED_AT,
      })
    )
  })

  it('should handle empty historic run data', () => {
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: {
        data: [],
      },
    } as any)

    const runRecordOffset: LabwareOffset = {
      id: 'offset-1',
      createdAt: CREATED_AT,
      definitionUri: LABWARE_URI,
      location: { slotName: 'A1' },
      vector: { x: 1, y: 2, z: 3 },
    }

    const databaseOffset: StoredLabwareOffset = {
      id: 'stored-offset-1',
      createdAt: CREATED_AT,
      definitionUri: LABWARE_URI,
      locationSequence: [
        { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      ],
      vector: { x: 4, y: 5, z: 6 },
    }

    vi.mocked(
      selectInitialRunRecordOffsets
    ).mockImplementation((runId: string) => (state: any) => [runRecordOffset])

    vi.mocked(
      selectInitialDatabaseOffsets
    ).mockImplementation((runId: string) => (state: any) => [databaseOffset])

    renderHook(() =>
      useOffsetConflictTimestamp(true, RUN_ID, {
        data: { protocolId: PROTOCOL_ID },
      } as Run)
    )

    expect(mockDispatch).toHaveBeenCalledWith(
      updateConflictTimestamp(RUN_ID, { isInitialized: true, timestamp: '' })
    )
  })

  it('should handle no matching protocol in historic runs', () => {
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: {
        data: [
          {
            current: false,
            protocolId: 'different-protocol-id',
            createdAt: CREATED_AT,
          },
        ],
      },
    } as any)

    const runRecordOffset: LabwareOffset = {
      id: 'offset-1',
      createdAt: CREATED_AT,
      definitionUri: LABWARE_URI,
      location: { slotName: 'A1' },
      vector: { x: 1, y: 2, z: 3 },
    }

    const databaseOffset: StoredLabwareOffset = {
      id: 'stored-offset-1',
      createdAt: CREATED_AT,
      definitionUri: LABWARE_URI,
      locationSequence: [
        { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      ],
      vector: { x: 4, y: 5, z: 6 },
    }

    vi.mocked(
      selectInitialRunRecordOffsets
    ).mockImplementation((runId: string) => (state: any) => [runRecordOffset])

    vi.mocked(
      selectInitialDatabaseOffsets
    ).mockImplementation((runId: string) => (state: any) => [databaseOffset])

    renderHook(() =>
      useOffsetConflictTimestamp(true, RUN_ID, {
        data: { protocolId: PROTOCOL_ID },
      } as Run)
    )

    expect(mockDispatch).toHaveBeenCalledWith(
      updateConflictTimestamp(RUN_ID, { isInitialized: true, timestamp: '' })
    )
  })
})
