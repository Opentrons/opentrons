import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { showDocumentationRequiredModal } from '/app/organisms/ODD/DocumentationRequired/DocumentationRequiredModal'
import { postDocumentation } from '/app/resources/access-control/postDocumentation'

import { requireDocumentation } from '../requireDocumentation'

import type { DocumentedActionKind } from '../../../../resources/access-control/types'

vi.mock(
  '/app/organisms/ODD/DocumentationRequired/DocumentationRequiredModal',
  () => ({
    showDocumentationRequiredModal: vi.fn(),
  })
)

vi.mock('/app/resources/access-control/postDocumentation', () => ({
  postDocumentation: vi.fn(),
}))

const ACTIONS_TO_DOCUMENT: DocumentedActionKind[] = [{ kind: 'PROTOCOL_PLAY' }]

describe('requireDocumentation', () => {
  beforeEach(() => {
    vi.mocked(postDocumentation).mockImplementation(() => Promise.resolve())
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('opens the modal, posts on confirm, and resolves with the modal result', async () => {
    vi.mocked(showDocumentationRequiredModal).mockResolvedValue({
      note: 'starting run for QC',
      confirmedAt: '2026-05-01T16:00:00.000Z',
    })

    const result = await requireDocumentation(ACTIONS_TO_DOCUMENT, 'alice')

    expect(result).toEqual({
      note: 'starting run for QC',
      confirmedAt: '2026-05-01T16:00:00.000Z',
      documentedBy: 'alice',
    })
    expect(showDocumentationRequiredModal).toHaveBeenCalledWith('alice')
    expect(postDocumentation).toHaveBeenCalledWith({
      actionsToDocument: ACTIONS_TO_DOCUMENT,
      note: 'starting run for QC',
      username: 'alice',
      confirmedAt: '2026-05-01T16:00:00.000Z',
    })
  })

  it('returns null when the user backs out of the modal', async () => {
    vi.mocked(showDocumentationRequiredModal).mockResolvedValue(null)

    const result = await requireDocumentation(ACTIONS_TO_DOCUMENT, 'alice')

    expect(result).toBeNull()
    expect(postDocumentation).not.toHaveBeenCalled()
  })
})
