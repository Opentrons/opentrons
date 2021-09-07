// protocol state selector tests

import * as SharedData from '@opentrons/shared-data'
import { mockDefinition } from '../../custom-labware/__fixtures__'
import * as protocol from '..'
import type { State } from '../../types'

jest.mock('@opentrons/shared-data')

const mockGetPipetteNameSpecs = SharedData.getPipetteNameSpecs as jest.MockedFunction<
  typeof SharedData.getPipetteNameSpecs
>

const mockPipetteSpecs1: any = {
  displayName: 'Pipette 1',
  name: 'pipette-name-1',
}

const mockPipetteSpecs2: any = {
  displayName: 'Pipette 2',
  name: 'pipette-name-2',
}

const SPECS: Array<{
  name: string
  selector: (state: State) => unknown
  state: State
  expected: unknown
}> = [
  {
    name: 'getProtocolFile',
    selector: protocol.getProtocolFile,
    state: { protocol: { file: { name: 'proto.json' } } } as any,
    expected: { name: 'proto.json' },
  },
  {
    name: 'getProtocolContents',
    selector: protocol.getProtocolContents,
    state: {
      protocol: { file: { name: 'proto.json' }, contents: 'fizzbuzz' },
    } as any,
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
    } as any,
    expected: { metadata: {} },
  },
  {
    name: 'getProtocolFilename with no file',
    selector: protocol.getProtocolFilename,
    state: { protocol: { file: null } } as any,
    expected: null,
  },
  {
    name: 'getProtocolFilename',
    selector: protocol.getProtocolFilename,
    state: { protocol: { file: { name: 'proto.json' } } } as any,
    expected: 'proto.json',
  },
  {
    name: 'getProtocolName with nothing loaded',
    selector: protocol.getProtocolName,
    state: { protocol: { file: null, contents: null, data: null } } as any,
    expected: null,
  },
  {
    name: 'getProtocolName from filename if no data',
    selector: protocol.getProtocolName,
    state: {
      protocol: {
        file: { name: 'proto.json' },
        contents: null,
        data: null,
      } as any,
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
    } as any,
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
    } as any,
    expected: 'A Protocol',
  },
  {
    name: 'getProtocolName from empty JSON',
    selector: protocol.getProtocolName,
    state: {
      protocol: {
        file: { name: 'proto.json' },
        contents: 'fizzbuzz',
        data: {},
      },
    } as any,
    expected: 'proto',
  },
  {
    name: 'getProtocolName from JSON Protocol >=v3 metadata',
    selector: protocol.getProtocolName,
    state: {
      protocol: {
        file: { name: 'proto.json' },
        contents: 'fizzbuzz',
        data: { metadata: { protocolName: 'A Protocol' } },
      },
    } as any,
    expected: 'A Protocol',
  },
  {
    name: 'getProtocolAuthor if no data',
    selector: protocol.getProtocolAuthor,
    state: { protocol: { data: null } } as any,
    expected: null,
  },
  {
    name: 'getProtocolAuthor if no metadata',
    selector: protocol.getProtocolAuthor,
    state: { protocol: { data: {} } } as any,
    expected: null,
  },
  {
    name: 'getProtocolAuthor if author not in metadata',
    selector: protocol.getProtocolAuthor,
    state: { protocol: { data: { metadata: {} } } } as any,
    expected: null,
  },
  {
    name: 'getProtocolAuthor if author in metadata',
    selector: protocol.getProtocolAuthor,
    state: { protocol: { data: { metadata: { author: 'Fizz Buzz' } } } } as any,
    expected: 'Fizz Buzz',
  },
  {
    name: 'getProtocolDescription if no data',
    selector: protocol.getProtocolDescription,
    state: { protocol: { data: null } } as any,
    expected: null,
  },
  {
    name: 'getProtocolDescription if no metaddata',
    selector: protocol.getProtocolDescription,
    state: { protocol: { data: {} } } as any,
    expected: null,
  },
  {
    name: 'getProtocolDescription if description not in metadata',
    selector: protocol.getProtocolDescription,
    state: { protocol: { data: { metadata: {} } } } as any,
    expected: null,
  },
  {
    name: 'getProtocolDescription if description in metadata',
    selector: protocol.getProtocolDescription,
    state: {
      protocol: { data: { metadata: { description: 'Fizzes buzzes' } } },
    } as any,
    expected: 'Fizzes buzzes',
  },
  {
    name: 'getProtocolDescription if description not in metadata',
    selector: protocol.getProtocolDescription,
    state: { protocol: { data: { metadata: {} } } } as any,
    expected: null,
  },
  {
    name: 'getProtocolDescription if description in metadata',
    selector: protocol.getProtocolDescription,
    state: {
      protocol: { data: { metadata: { description: 'Fizzes buzzes' } } },
    } as any,
    expected: 'Fizzes buzzes',
  },
  {
    name: 'getProtocolLastUpdated if nothing loaded',
    selector: protocol.getProtocolLastUpdated,
    state: { protocol: { file: null, contents: null, data: null } } as any,
    expected: null,
  },
  {
    name: 'getProtocolLastUpdated from file.lastModified',
    selector: protocol.getProtocolLastUpdated,
    state: { protocol: { file: { lastModified: 1 } } } as any,
    expected: 1,
  },
  {
    name: 'getProtocolLastUpdated with data but no metadata',
    selector: protocol.getProtocolLastUpdated,
    state: {
      protocol: {
        file: { lastModified: 1 },
        data: {},
      },
    } as any,
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
    } as any,
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
    } as any,
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
    } as any,
    expected: 4,
  },
  {
    name: 'getProtocolApiVersion returns null if null in state',
    selector: protocol.getProtocolApiVersion,
    state: {
      robot: { session: { apiLevel: null } },
    } as any,
    expected: null,
  },
  {
    name: 'getProtocolApiVersion concats major.minor from state',
    selector: protocol.getProtocolApiVersion,
    state: {
      robot: { session: { apiLevel: [2, 4] } },
    } as any,
    expected: '2.4',
  },
  {
    name: 'getProtocolMethod if nothing loaded',
    selector: protocol.getProtocolMethod,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: { file: null, contents: null, data: null },
    } as any,
    expected: null,
  },
  {
    name: 'getProtocolMethod if file not yet read',
    selector: protocol.getProtocolMethod,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: { file: { name: 'proto.py' }, contents: null, data: null },
    } as any,
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
    } as any,
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
    } as any,
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
    } as any,
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
    } as any,
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
    } as any,
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
    } as any,
    expected: 'Protocol Designer v4.5.6',
  },
  {
    name: 'getLabwareDefBySlot returns empty object by default',
    selector: protocol.getLabwareDefBySlot,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: {
        file: { name: 'proto.json', type: 'json' },
        contents: 'fizzbuzz',
        data: null,
      },
    } as any,
    expected: {},
  },
  {
    name: 'getLabwareDefBySlot returns empty object with invalid data',
    selector: protocol.getLabwareDefBySlot,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: {
        file: { name: 'proto.json', type: 'json' },
        contents: 'fizzbuzz',
        data: { labwareDefinitions: {} },
      },
    } as any,
    expected: {},
  },
  {
    name: 'getLabwareDefBySlot with JSON protocol without modules (v3)',
    selector: protocol.getLabwareDefBySlot,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: {
        file: { name: 'proto.json', type: 'json' },
        contents: 'fizzbuzz',
        data: {
          metadata: {},
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
    } as any,
    expected: {
      1: { mockDefinition1: true },
      2: { mockDefinition2: true },
    },
  },
  {
    name: 'getLabwareDefBySlot with JSON protocol that includes modules (>=v4)',
    selector: protocol.getLabwareDefBySlot,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: {
        file: { name: 'proto.json', type: 'json' },
        contents: 'fizzbuzz',
        data: {
          metadata: {},
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
    } as any,
    expected: {
      1: { mockDefinition1: true },
      2: { mockDefinition2: true },
    },
  },
  {
    name: 'getLabwareDefBySlot with JSON protocol that includes thermocycler',
    selector: protocol.getLabwareDefBySlot,
    state: {
      robot: { session: { apiLevel: [1, 0] } },
      protocol: {
        file: { name: 'proto.json', type: 'json' },
        contents: 'fizzbuzz',
        data: {
          metadata: {},
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
    } as any,
    expected: {
      1: { mockDefinition1: true },
      7: { mockDefinition2: true },
    },
  },
  {
    name: 'getProtocolPipetteTipRacks with JSON protocol',
    selector: protocol.getProtocolPipetteTipRacks,
    state: {
      protocol: {
        data: {
          labware: {
            'tiprack-id-1': {
              slot: '1',
              definitionId: 'tiprack-def-1',
              displayName: 'TipRack 1',
            },
            'tiprack-id-2': {
              slot: '2',
              definitionId: 'tiprack-def-2',
              displayName: 'TipRack 2',
            },
          },
          pipettes: {
            'pipette-id-1': { mount: 'left', name: 'pipette-name-1' },
            'pipette-id-2': { mount: 'right', name: 'pipette-name-2' },
          },
          labwareDefinitions: {
            'tiprack-def-1': { mockDefinition },
            'tiprack-def-2': { mockDefinition },
          },
          commands: [
            {
              command: 'pickUpTip',
              params: { pipette: 'pipette-id-1', labware: 'tiprack-id-1' },
            },
            {
              command: 'pickUpTip',
              params: { pipette: 'pipette-id-2', labware: 'tiprack-id-2' },
            },
          ],
        },
      },
    } as any,
    expected: {
      left: {
        pipetteSpecs: mockPipetteSpecs1,
        tipRackDefs: [{ mockDefinition }],
      },
      right: {
        pipetteSpecs: mockPipetteSpecs2,
        tipRackDefs: [{ mockDefinition }],
      },
    },
  },
  {
    name: 'getProtocolPipetteTipRacks with JSON protocol with missing commands',
    selector: protocol.getProtocolPipetteTipRacks,
    state: {
      protocol: {
        data: {
          labware: {
            'tiprack-id-1': {
              slot: '1',
              definitionId: 'tiprack-def-1',
              displayName: 'TipRack 1',
            },
            'tiprack-id-2': {
              slot: '2',
              definitionId: 'tiprack-def-2',
              displayName: 'TipRack 2',
            },
          },
          pipettes: {
            'pipette-id-1': { mount: 'left', name: 'pipette-name-1' },
            'pipette-id-2': { mount: 'right', name: 'pipette-name-2' },
          },
          labwareDefinitions: {
            'tiprack-def-1': { mockDefinition },
            'tiprack-def-2': { mockDefinition },
          },
        },
      },
    } as any,
    expected: {
      left: null,
      right: null,
    },
  },
  {
    name: 'getProtocolPipetteTipRacks with JSON protocol with one pipette',
    selector: protocol.getProtocolPipetteTipRacks,
    state: {
      protocol: {
        data: {
          labware: {
            'tiprack-id-1': {
              slot: '1',
              definitionId: 'tiprack-def-1',
              displayName: 'TipRack 1',
            },
          },
          pipettes: {
            'pipette-id-1': { mount: 'left', name: 'pipette-name-1' },
          },
          labwareDefinitions: {
            'tiprack-def-1': { mockDefinition },
          },
          commands: [
            {
              command: 'pickUpTip',
              params: { pipette: 'pipette-id-1', labware: 'tiprack-id-1' },
            },
          ],
        },
      },
    } as any,
    expected: {
      left: {
        pipetteSpecs: mockPipetteSpecs1,
        tipRackDefs: [{ mockDefinition }],
      },
      right: null,
    },
  },
]

describe('protocol selectors', () => {
  beforeEach(() => {
    mockGetPipetteNameSpecs.mockImplementation(name => {
      if (name === mockPipetteSpecs1.name) return mockPipetteSpecs1
      if (name === mockPipetteSpecs2.name) return mockPipetteSpecs2
      return null
    })
  })
  SPECS.forEach(spec => {
    const { name, selector, state, expected } = spec
    it(name, () => expect(selector(state)).toEqual(expected))
  })
})
