import { useDispatch } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { updateLPCDeck } from '/app/redux/protocol-runs'

import { useUpdateDeckConfig } from '../useUpdateDeckConfig'

vi.mock('react-redux')
vi.mock('/app/redux/protocol-runs')

describe('useUpdateDeckConfig', () => {
  const RUN_ID = 'run-123'
  const MOCK_DECK_CONFIG = { id: 'deck-config-1' } as any
  const mockDispatch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    vi.mocked(updateLPCDeck).mockImplementation(
      (runId: string, deckConfig: any) =>
        ({ type: 'UPDATE_LPC_DECK', runId, deckConfig } as any)
    )
  })

  it('should dispatch updateLPCDeck when runId and deckConfig are provided', () => {
    renderHook(() => {
      useUpdateDeckConfig(true, RUN_ID, MOCK_DECK_CONFIG)
    })

    expect(mockDispatch).toHaveBeenCalledTimes(1)
    expect(updateLPCDeck).toHaveBeenCalledWith(RUN_ID, MOCK_DECK_CONFIG)
    expect(mockDispatch).toHaveBeenCalledWith(
      updateLPCDeck(RUN_ID, MOCK_DECK_CONFIG)
    )
  })

  it('should not dispatch when runId is null', () => {
    renderHook(() => {
      useUpdateDeckConfig(true, null, MOCK_DECK_CONFIG)
    })

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(updateLPCDeck).not.toHaveBeenCalled()
  })

  it('should not dispatch when deckConfig is undefined', () => {
    renderHook(() => {
      useUpdateDeckConfig(true, RUN_ID, undefined)
    })

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(updateLPCDeck).not.toHaveBeenCalled()
  })

  it('should not dispatch when both runId and deckConfig are undefined/null', () => {
    renderHook(() => {
      useUpdateDeckConfig(true, null, undefined)
    })

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(updateLPCDeck).not.toHaveBeenCalled()
  })

  it('should re-dispatch when deckConfig changes', () => {
    const { rerender } = renderHook(
      props => {
        useUpdateDeckConfig(props.isFlex, props.runId, props.deckConfig)
      },
      {
        initialProps: {
          isFlex: true,
          runId: RUN_ID,
          deckConfig: MOCK_DECK_CONFIG,
        },
      }
    )

    expect(mockDispatch).toHaveBeenCalledTimes(1)
    mockDispatch.mockClear()

    const NEW_DECK_CONFIG = { id: 'deck-config-2' } as any
    rerender({ isFlex: true, runId: RUN_ID, deckConfig: NEW_DECK_CONFIG })

    expect(mockDispatch).toHaveBeenCalledTimes(1)
    expect(updateLPCDeck).toHaveBeenCalledWith(RUN_ID, NEW_DECK_CONFIG)
    expect(mockDispatch).toHaveBeenCalledWith(
      updateLPCDeck(RUN_ID, NEW_DECK_CONFIG)
    )
  })

  it('should not dispatch if the robot is not a flex', () => {
    renderHook(
      props => {
        useUpdateDeckConfig(props.isFlex, props.runId, props.deckConfig)
      },
      {
        initialProps: {
          isFlex: false,
          runId: RUN_ID,
          deckConfig: MOCK_DECK_CONFIG,
        },
      }
    )

    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
