import type { DocumentedActionKind } from './types'

interface PostDocumentationInput {
  actionsToDocument: DocumentedActionKind[]
  note: string
  username: string
  /** ISO timestamp of when the user confirmed. */
  confirmedAt: string
}

/**
 * Posts a documented-action audit-log entry to the robot server.
 *
 * No-op stub for now.
 *
 * TODO(TZ, 5-5-26): wire to the real `/access-control/audit` endpoint.
 */
export const postDocumentation = async ({
  actionsToDocument,
  note,
  username,
  confirmedAt,
}: PostDocumentationInput): Promise<void> => {
  // no-op
}
