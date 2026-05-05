import type { DocumentedActionKind } from './DocumentedAction'

export interface PostDocumentationInput {
  action: DocumentedActionKind
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
export const postDocumentation = async (
  _input: PostDocumentationInput
): Promise<void> => {
  // no-op
}
