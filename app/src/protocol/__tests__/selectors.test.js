// protocol state selector tests

import * as protocol from '..'

const SPECS = [
  {
    name: 'getProtocolFile',
    selector: protocol.getProtocolFile,
    state: { protocol: { file: { name: 'proto.json' } } },
    expected: { name: 'proto.json' },
  },
  {
    name: 'getProtocolContents',
    selector: protocol.getProtocolContents,
    state: { protocol: { file: { name: 'proto.json' }, contents: 'fizzbuzz' } },
    expected: 'fizzbuzz',
  },
  {
    name: 'getProtocolData',
    selector: protocol.getProtocolData,
    state: {
      protocol: {
        file: { name: 'proto.json' },
        contents: 'fizzbuzz',
        data: { metadata: {} },
      },
    },
    expected: { metadata: {} },
  },
  {
    name: 'getProtocolFilename with no file',
    selector: protocol.getProtocolFilename,
    state: { protocol: { file: null } },
    expected: null,
  },
  {
    name: 'getProtocolFilename',
    selector: protocol.getProtocolFilename,
    state: { protocol: { file: { name: 'proto.json' } } },
    expected: 'proto.json',
  },
  {
    name: 'getProtocolName with nothing loaded',
    selector: protocol.getProtocolName,
    state: { protocol: { file: null, contents: null, data: null } },
    expected: null,
  },
  {
    name: 'getProtocolName from filename if no data',
    selector: protocol.getProtocolName,
    state: {
      protocol: { file: { name: 'proto.json' }, contents: null, data: null },
    },
    expected: 'proto',
  },
  {
    name: 'getProtocolName from filename if data does not include name',
    selector: protocol.getProtocolName,
    state: {
      protocol: {
        file: { name: 'proto.json' },
        contents: 'fizzbuzz',
        data: { metadata: {} },
      },
    },
    expected: 'proto',
  },
  {
    name: 'getProtocolName from Python metadata',
    selector: protocol.getProtocolName,
    state: {
      protocol: {
        file: { name: 'proto.json' },
        contents: 'fizzbuzz',
        data: { metadata: { 'protocol-name': 'A Protocol' } },
      },
    },
    expected: 'A Protocol',
  },
  {
    name: 'getProtocolName from JSON Protocol >=v3 metadata',
    selector: protocol.getProtocolName,
    state: {
      protocol: {
        file: { name: 'proto.json' },
        contents: 'fizzbuzz',
        data: { schemaVersion: 3, metadata: { protocolName: 'A Protocol' } },
      },
    },
    expected: 'A Protocol',
  },
  {
    name: 'getProtocolAuthor if no data',
    selector: protocol.getProtocolAuthor,
    state: { protocol: { data: null } },
    expected: null,
  },
  {
    name: 'getProtocolAuthor if author not in metadata',
    selector: protocol.getProtocolAuthor,
    state: { protocol: { data: { metadata: {} } } },
    expected: null,
  },
  {
    name: 'getProtocolAuthor if author in metadata',
    selector: protocol.getProtocolAuthor,
    state: { protocol: { data: { metadata: { author: 'Fizz Buzz' } } } },
    expected: 'Fizz Buzz',
  },
  {
    name: 'getProtocolDescription if no data',
    selector: protocol.getProtocolDescription,
    state: { protocol: { data: null } },
    expected: null,
  },
  {
    name: 'getProtocolDescription if description not in metadata',
    selector: protocol.getProtocolDescription,
    state: { protocol: { data: { metadata: {} } } },
    expected: null,
  },
  {
    name: 'getProtocolDescription if description in metadata',
    selector: protocol.getProtocolDescription,
    state: {
      protocol: { data: { metadata: { description: 'Fizzes buzzes' } } },
    },
    expected: 'Fizzes buzzes',
  },
  {
    name: 'getProtocolDescription if description not in metadata',
    selector: protocol.getProtocolDescription,
    state: { protocol: { data: { metadata: {} } } },
    expected: null,
  },
  {
    name: 'getProtocolDescription if description in metadata',
    selector: protocol.getProtocolDescription,
    state: {
      protocol: { data: { metadata: { description: 'Fizzes buzzes' } } },
    },
    expected: 'Fizzes buzzes',
  },
  {
    name: 'getProtocolLastUpdated if nothing loaded',
    selector: protocol.getProtocolLastUpdated,
    state: { protocol: { file: null, contents: null, data: null } },
    expected: null,
  },
  {
    name: 'getProtocolLastUpdated from file.lastModified',
    selector: protocol.getProtocolLastUpdated,
    state: { protocol: { file: { lastModified: 1 } } },
    expected: 1,
  },
  {
    name: 'getProtocolLastUpdated from metadata.created',
    selector: protocol.getProtocolLastUpdated,
    state: {
      protocol: {
        file: { lastModified: 1 },
        data: { metadata: { created: 2 } },
      },
    },
    expected: 2,
  },
  {
    name: 'getProtocolLastUpdated from metadata.last-modified',
    selector: protocol.getProtocolLastUpdated,
    state: {
      protocol: {
        file: { lastModified: 1 },
        data: { metadata: { created: 2, 'last-modified': 3 } },
      },
    },
    expected: 3,
  },
  {
    name: 'getProtocolLastUpdated from >= v3 JSON protocol',
    selector: protocol.getProtocolLastUpdated,
    state: {
      protocol: {
        file: { lastModified: 1 },
        data: { metadata: { created: 2, lastModified: 4 } },
      },
    },
    expected: 4,
  },
  {
    name: 'getProtocolApiVersion returns null if null in state',
    selector: protocol.getProtocolApiVersion,
    state: {
      robot: { session: { apiLevel: null } },
    },
    expected: null,
  },
  {
    name: 'getProtocolApiVersion concats major.minor from state',
    selector: protocol.getProtocolApiVersion,
    state: {
      robot: { session: { apiLevel: [2, 4] } },
    },
    expected: '2.4',
  },
  {
    name: 'getProtocolMethod if nothing loaded',
    selector: protocol.getProtocolMethod,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: { file: null, contents: null, data: null },
    },
    expected: null,
  },
  {
    name: 'getProtocolMethod if file not yet read',
    selector: protocol.getProtocolMethod,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: { file: { name: 'proto.py' }, contents: null, data: null },
    },
    expected: null,
  },
  {
    name: 'getProtocolMethod if non-JSON file has been read',
    selector: protocol.getProtocolMethod,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: {
        file: { name: 'proto.py' },
        contents: 'fizzbuzz',
        data: null,
      },
    },
    expected: 'Python Protocol API v1.0',
  },
  {
    name: 'getProtocolMethod if JSON file read but no data',
    selector: protocol.getProtocolMethod,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: {
        file: { name: 'proto.json', type: 'json' },
        contents: 'fizzbuzz',
        data: null,
      },
    },
    expected: 'Unknown Application',
  },
  {
    name: 'getProtocolMethod if JSON file read but no name in data',
    selector: protocol.getProtocolMethod,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: {
        file: { name: 'proto.json', type: 'json' },
        contents: 'fizzbuzz',
        data: { metadata: {} },
      },
    },
    expected: 'Unknown Application',
  },
  {
    name: 'getProtocolMethod if JSON file read with name in data',
    selector: protocol.getProtocolMethod,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: {
        file: { name: 'proto.json', type: 'json' },
        contents: 'fizzbuzz',
        data: {
          metadata: {},
          'designer-application': {
            'application-name': 'opentrons/protocol-designer',
          },
        },
      },
    },
    expected: 'Protocol Designer',
  },
  {
    name: 'getProtocolMethod if JSON file read with name and version in data',
    selector: protocol.getProtocolMethod,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: {
        file: { name: 'proto.json', type: 'json' },
        contents: 'fizzbuzz',
        data: {
          metadata: {},
          'designer-application': {
            'application-name': 'opentrons/protocol-designer',
            'application-version': '1.2.3',
          },
        },
      },
    },
    expected: 'Protocol Designer v1.2.3',
  },
  {
    name:
      'getProtocolMethod if >= v3 JSON file read with name and version in data',
    selector: protocol.getProtocolMethod,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: {
        file: { name: 'proto.json', type: 'json' },
        contents: 'fizzbuzz',
        data: {
          metadata: {},
          designerApplication: {
            name: 'opentrons/protocol-designer',
            version: '4.5.6',
          },
        },
      },
    },
    expected: 'Protocol Designer v4.5.6',
  },
  {
    name: 'getLabwareDefBySlot with v3 JSON protocol',
    selector: protocol.getLabwareDefBySlot,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: {
        file: { name: 'proto.json', type: 'json' },
        contents: 'fizzbuzz',
        data: {
          metadata: {},
          schemaVersion: 3,
          labware: {
            'labware-id-1': { slot: '1', definitionId: 'labware-def-1' },
            'labware-id-2': { slot: '2', definitionId: 'labware-def-2' },
          },
          labwareDefinitions: {
            'labware-def-1': { mockDefinition1: true },
            'labware-def-2': { mockDefinition2: true },
          },
        },
      },
    },
    expected: {
      '1': { mockDefinition1: true },
      '2': { mockDefinition2: true },
    },
  },
  {
    name: 'getLabwareDefBySlot with v4 JSON protocol',
    selector: protocol.getLabwareDefBySlot,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: {
        file: { name: 'proto.json', type: 'json' },
        contents: 'fizzbuzz',
        data: {
          metadata: {},
          schemaVersion: 4,
          labware: {
            'labware-id-1': { slot: '1', definitionId: 'labware-def-1' },
            'labware-id-2': {
              slot: 'module-id-1',
              definitionId: 'labware-def-2',
            },
          },
          modules: {
            'module-id-1': { slot: '2' },
          },
          labwareDefinitions: {
            'labware-def-1': { mockDefinition1: true },
            'labware-def-2': { mockDefinition2: true },
          },
        },
      },
    },
    expected: {
      '1': { mockDefinition1: true },
      '2': { mockDefinition2: true },
    },
  },
  {
    name: 'getLabwareDefBySlot with v4 JSON protocol with thermocycler',
    selector: protocol.getLabwareDefBySlot,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: {
        file: { name: 'proto.json', type: 'json' },
        contents: 'fizzbuzz',
        data: {
          metadata: {},
          schemaVersion: 4,
          labware: {
            'labware-id-1': { slot: '1', definitionId: 'labware-def-1' },
            'labware-id-2': {
              slot: 'thermocycler-id-1',
              definitionId: 'labware-def-2',
            },
          },
          modules: {
            'thermocycler-id-1': { slot: 'span7_8_10_11' },
          },
          labwareDefinitions: {
            'labware-def-1': { mockDefinition1: true },
            'labware-def-2': { mockDefinition2: true },
          },
        },
      },
    },
    expected: {
      '1': { mockDefinition1: true },
      '7': { mockDefinition2: true },
    },
  },
]

describe('protocol selectors', () => {
  SPECS.forEach(spec => {
    const { name, selector, state, expected } = spec
    it(name, () => expect(selector(state)).toEqual(expected))
  })
})
