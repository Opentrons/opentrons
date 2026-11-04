import { useSelector } from 'react-redux'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useCreateLabwareOffsetsMutation,
  useDeleteLabwareOffsetMutation,
} from '@opentrons/react-api-client'

import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { selectPendingOffsetOperations } from '/app/redux/protocol-runs'

import { useSaveWorkingOffsets } from '../useSaveWorkingOffsets'

vi.mock('react-redux')
vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/protocol-runs')

describe('useSaveWorkingOffsets', () => {
  const mockRunId = 'mock_run_id'
  const mockReportSaveOffset = vi.fn()
  const mockAddActionToDocument = vi.fn()

  const mockProps = {
    runId: mockRunId,
    analytics: { reportSaveOffset: mockReportSaveOffset },
    commandDocState: ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
    addActionToDocument: mockAddActionToDocument,
  } as any

  const mockCreateLabwareOffsets = vi.fn()
  const mockDeleteLabwareOffset = vi.fn()

  const mockToUpdate = [
    {
      id: 'offset-1',
      labwareId: 'labware-1',
      offsetVector: { x: 1, y: 1, z: 1 },
    },
    {
      id: 'offset-2',
      labwareId: 'labware-2',
      offsetVector: { x: 2, y: 2, z: 2 },
    },
  ]
  const mockToDelete = ['offset-3', 'offset-4']

  const mockPendingOffsetOperations = {
    toUpdate: mockToUpdate,
    toDelete: mockToDelete,
  }

  const mockStoredOffsets = [
    { id: 'offset-1', labwareId: 'labware-1', vector: { x: 1, y: 1, z: 1 } },
    { id: 'offset-2', labwareId: 'labware-2', vector: { x: 2, y: 2, z: 2 } },
  ]

  const mockDeletedOffsets = [
    { id: '', labwareId: '', vector: { x: 0, y: 0, z: 0 } },
    { id: '', labwareId: '', vector: { x: 0, y: 0, z: 0 } },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useSelector).mockImplementation(selector => {
      if (selector === selectPendingOffsetOperations(mockRunId)) {
        return mockPendingOffsetOperations
      }
    })

    vi.mocked(useCreateLabwareOffsetsMutation).mockReturnValue({
      createLabwareOffsets: mockCreateLabwareOffsets,
    } as any)

    vi.mocked(useDeleteLabwareOffsetMutation).mockReturnValue({
      deleteLabwareOffset: mockDeleteLabwareOffset,
    } as any)

    mockCreateLabwareOffsets.mockResolvedValue(mockStoredOffsets)
    mockDeleteLabwareOffset.mockResolvedValue({
      id: '',
      labwareId: '',
      vector: { x: 0, y: 0, z: 0 },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return expected functions and initial state', () => {
    const { result } = renderHook(() => useSaveWorkingOffsets(mockProps))

    expect(result.current).toHaveProperty('saveWorkingOffsets')
    expect(result.current).toHaveProperty(
      'isSavingWorkingOffsetsLoading',
      false
    )
  })

  it('should call createLabwareOffsets with toUpdate and deleteLabwareOffset with each toDelete id', async () => {
    const { result } = renderHook(() => useSaveWorkingOffsets(mockProps))

    let returnValue: any

    await act(async () => {
      returnValue = await result.current.saveWorkingOffsets()
    })

    expect(useCreateLabwareOffsetsMutation).toHaveBeenCalledWith(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )
    expect(useDeleteLabwareOffsetMutation).toHaveBeenCalledWith(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )
    expect(mockCreateLabwareOffsets).toHaveBeenCalledWith(mockToUpdate)
    expect(mockDeleteLabwareOffset).toHaveBeenCalledWith('offset-3')
    expect(mockDeleteLabwareOffset).toHaveBeenCalledWith('offset-4')
    expect(mockDeleteLabwareOffset).toHaveBeenCalledTimes(2)
    expect(mockAddActionToDocument).toHaveBeenCalledWith('create_offsets')
    expect(mockAddActionToDocument).toHaveBeenCalledWith('delete_offsets')
    expect(returnValue).toEqual([mockStoredOffsets, mockDeletedOffsets])
  })

  it('should set isLoading to true during operation and false afterwards', async () => {
    const { result } = renderHook(() => useSaveWorkingOffsets(mockProps))

    let resolveCreate: Function
    mockCreateLabwareOffsets.mockReturnValue(
      new Promise(resolve => {
        resolveCreate = resolve
      })
    )
    let savePromise: Promise<any>

    act(() => {
      savePromise = result.current.saveWorkingOffsets()
    })

    expect(result.current.isSavingWorkingOffsetsLoading).toBe(true)

    await act(async () => {
      resolveCreate(mockStoredOffsets)
      await savePromise
    })

    expect(result.current.isSavingWorkingOffsetsLoading).toBe(false)
  })

  it('should handle createLabwareOffsets returning a single item', async () => {
    const singleOffset = {
      id: 'offset-1',
      labwareId: 'labware-1',
      vector: { x: 1, y: 1, z: 1 },
    }
    mockCreateLabwareOffsets.mockResolvedValue(singleOffset)

    const { result } = renderHook(() => useSaveWorkingOffsets(mockProps))

    let returnValue: any

    await act(async () => {
      returnValue = await result.current.saveWorkingOffsets()
    })

    expect(returnValue).toEqual([[singleOffset], mockDeletedOffsets])
  })

  it('should handle errors during save operation', async () => {
    mockCreateLabwareOffsets.mockRejectedValue(new Error('Create error'))

    const { result } = renderHook(() => useSaveWorkingOffsets(mockProps))

    let returnValue: any

    await act(async () => {
      returnValue = await result.current.saveWorkingOffsets()
    })

    expect(result.current.isSavingWorkingOffsetsLoading).toBe(false)
    expect(mockAddActionToDocument).not.toHaveBeenCalled()
    expect(returnValue).toEqual([[], []])
  })

  it('should handle empty toUpdate and toDelete arrays', async () => {
    vi.mocked(useSelector).mockImplementationOnce(selector => {
      if (selector === selectPendingOffsetOperations(mockRunId)) {
        return { toUpdate: [], toDelete: [] }
      }
    })

    const { result } = renderHook(() => useSaveWorkingOffsets(mockProps))

    let returnValue: any

    await act(async () => {
      returnValue = await result.current.saveWorkingOffsets()
    })

    expect(mockCreateLabwareOffsets).not.toHaveBeenCalled()
    expect(mockDeleteLabwareOffset).not.toHaveBeenCalled()
    expect(mockAddActionToDocument).not.toHaveBeenCalled()
    expect(returnValue).toEqual([[], []])
  })
})
