import { afterEach, describe, expect, it, vi } from 'vitest'

import { showDocumentationRequiredModal } from '../DocumentationRequiredModal'
import { requireDocumentation } from '../requireDocumentation'

import type { DocumentationReport } from '@opentrons/react-api-client'

vi.mock('../DocumentationRequiredModal', () => ({
  showDocumentationRequiredModal: vi.fn(),
}))

describe('requireDocumentation', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('opens the modal, posts on confirm, and resolves with the modal result', async () => {
    vi.mocked(showDocumentationRequiredModal).mockResolvedValue(
      'starting calibration' as DocumentationReport
    )

    const result = await requireDocumentation('alice', [])

    expect(result).toEqual('starting calibration' as DocumentationReport)
    expect(showDocumentationRequiredModal).toHaveBeenCalledWith(
      'alice',
      [],
      undefined
    )
  })
})
