// @flow
// protocol type defs

// TODO(mc, 2018-09-05): swap out with type ProtocolFile in
//   protocol-designer/src/file-types.js when it is aligned with schema in
//   shared-data/protocol-json-schema/protocol-schema.json
export type ProtocolData = {
  metadata: {
    'protocol-name'?: string,
    author?: string,
    description?: ?string,
    created?: number,
    'last-modified'?: ?number,
  },
  'designer-application'?: {
    'application-name'?: string,
    'application-version'?: string,
  },
}

export type ProtocolFile = {
  name: string,
  type: ?string,
  lastModified: ?number,
}

export type ProtocolState = {
  file: ?ProtocolFile,
  contents: ?string,
  data: ?ProtocolData,
}
