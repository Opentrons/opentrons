import { afterEach, describe, expect, it, vi } from 'vitest'

import { showDocumentationRequiredModal } from '../DocumentationRequiredModal'
import { requireDocumentation } from '../requireDocumentation'

import type { DocumentedActionKind } from '../../../local-resources/access-control/types'

vi.mock('../DocumentationRequiredModal', () => ({
  showDocumentationRequiredModal: vi.fn(),
}))

const ACTIONS_TO_DOCUMENT: DocumentedActionKind[] = [{ kind: 'PROTOCOL_PLAY' }]

describe('requireDocumentation', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('opens the modal, posts on confirm, and resolves with the modal result', async () => {
    vi.mocked(showDocumentationRequiredModal).mockResolvedValue({
      note: 'starting run for QC',
      confirmedAt: '2026-05-01T16:00:00.000Z',
      documentedBy: 'alice',
    })

    const result = await requireDocumentation(
      ACTIONS_TO_DOCUMENT,
      'alice',
      true
    )

    expect(result).toEqual({
      note: 'starting run for QC',
      confirmedAt: '2026-05-01T16:00:00.000Z',
      documentedBy: 'alice',
    })
    expect(showDocumentationRequiredModal).toHaveBeenCalledWith('alice', true)
  })

  it('returns null when the user backs out of the modal', async () => {
    vi.mocked(showDocumentationRequiredModal).mockResolvedValue(null)

    await expect(
      requireDocumentation(ACTIONS_TO_DOCUMENT, 'alice', true)
    ).rejects.toThrow(`No documentation provided for action: undefined`)
  })
})
