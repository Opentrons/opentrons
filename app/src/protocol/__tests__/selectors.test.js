// protocol state selector tests

import * as protocol from '..'

const SPECS = [
  {
    name: 'getProtocolFile',
    selector: protocol.getProtocolFile,
    state: {protocol: {file: {name: 'proto.json'}}},
    expected: {name: 'proto.json'},
  },
  {
    name: 'getProtocolFilename with no file',
    selector: protocol.getProtocolFilename,
    state: {protocol: {file: null}},
    expected: null,
  },
  {
    name: 'getProtocolFilename',
    selector: protocol.getProtocolFilename,
    state: {protocol: {file: {name: 'proto.json'}}},
    expected: 'proto.json',
  },
]

describe('protocol selectors', () => {
  SPECS.forEach(spec => {
    const {name, selector, state, expected} = spec
    test(name, () => expect(selector(state)).toEqual(expected))
  })
})
