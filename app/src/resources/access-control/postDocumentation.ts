import type { DocumentedAction } from './DocumentedAction'

export interface PostDocumentationInput {
  action: DocumentedAction
  note: string
  username: string
  /** ISO timestamp of when the user confirmed. */
  confirmedAt: string
}

/**
 * Posts a documented-action audit-log entry to the robot server.
 *
 * No-op stub for now. Centralized here so the access-control gate has a
 * single place to evolve (endpoint URL, request shape, retries, error
 * mapping) without touching call sites or guards.
 *
 * TODO(access-control): wire to the real `/access-control/audit` endpoint
 * once it ships. Flip the implementation here and every gated action will
 * start emitting.
 */
export const postDocumentation = async (
  _input: PostDocumentationInput
): Promise<void> => {
  // no-op
}
