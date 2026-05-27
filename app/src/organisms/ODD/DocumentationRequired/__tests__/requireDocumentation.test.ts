import { afterEach, describe, expect, it, vi } from 'vitest'

import { showDocumentationRequiredModal } from '../DocumentationRequiredModal'
import { requireDocumentation } from '../requireDocumentation'

import type { DocumentationReport } from '@opentrons/react-api-client'
import type { DocumentedActionKind } from '/app/local-resources/access-control/types'

vi.mock('../DocumentationRequiredModal', () => ({
  showDocumentationRequiredModal: vi.fn(),
}))

const ACTIONS_TO_DOCUMENT: DocumentedActionKind[] = [{ kind: 'PROTOCOL_PLAY' }]

describe('requireDocumentation', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('opens the modal, posts on confirm, and resolves with the modal result', async () => {
    vi.mocked(showDocumentationRequiredModal).mockResolvedValue(
      'starting calibration' as DocumentationReport
    )

    const result = await requireDocumentation(ACTIONS_TO_DOCUMENT, 'alice')

    expect(result).toEqual('starting calibration' as DocumentationReport)
    expect(showDocumentationRequiredModal).toHaveBeenCalledWith('alice')
  })

  it('returns empty string when the user backs out of the modal', async () => {
    vi.mocked(showDocumentationRequiredModal).mockResolvedValue(
      '' as DocumentationReport
    )

    await expect(
      requireDocumentation(ACTIONS_TO_DOCUMENT, 'alice')
    ).rejects.toThrow(`No documentation provided for action: `)
  })
})
