import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { showDocumentationRequiredModal } from '/app/organisms/ODD/DocumentationRequired'
import { postDocumentation } from '/app/resources/access-control/postDocumentation'

import { useRequireDocumentation } from '../useRequireDocumentation'

vi.mock('/app/organisms/ODD/DocumentationRequired', () => ({
  showDocumentationRequiredModal: vi.fn(),
}))

vi.mock('/app/resources/access-control', () => ({
  postDocumentation: vi.fn(),
}))

describe('useRequireDocumentation', () => {
  beforeEach(() => {
    vi.mocked(postDocumentation).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('opens the modal, posts on confirm, and resolves with the modal result', async () => {
    vi.mocked(showDocumentationRequiredModal).mockResolvedValue({
      note: 'starting run for QC',
      confirmedAt: '2026-05-01T16:00:00.000Z',
    })

    const { result } = renderHook(() => useRequireDocumentation())

    const got = await act(
      async () =>
        await result.current({ kind: 'PROTOCOL_PLAY' }, { username: 'alice' })
    )
    expect(got).toEqual({
      note: 'starting run for QC',
      confirmedAt: '2026-05-01T16:00:00.000Z',
      documentedBy: 'alice',
    })
    expect(showDocumentationRequiredModal).toHaveBeenCalledWith({
      userName: 'alice',
    })
    expect(postDocumentation).toHaveBeenCalledWith({
      action: { kind: 'PROTOCOL_PLAY' },
      note: 'starting run for QC',
      username: 'alice',
      confirmedAt: '2026-05-01T16:00:00.000Z',
    })
  })

  it('returns null when the user backs out of the modal', async () => {
    vi.mocked(showDocumentationRequiredModal).mockResolvedValue(null)

    const { result } = renderHook(() => useRequireDocumentation())

    const got = await act(
      async () =>
        await result.current({ kind: 'PROTOCOL_PLAY' }, { username: 'alice' })
    )
    expect(got).toBeNull()
    expect(postDocumentation).not.toHaveBeenCalled()
  })
})
