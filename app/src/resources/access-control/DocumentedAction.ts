/**
 * Every action in the robot UI that requires the user to
 * leave a note in the access-control audit log before it executes.
 */
export type DocumentedAction = {
  kind: 'PROTOCOL_PLAY'
  runId: string
  protocolName: string
}

export type DocumentedActionKind = DocumentedAction['kind']

export interface DocumentationResult {
  note: string
  confirmedAt: string
  documentedBy: string
}
