export interface DocumentedActionKind {
  kind: 'PROTOCOL_PLAY'
}

export type DocumentationReport = string & {
  readonly _brand: 'DocumentationReport'
}
