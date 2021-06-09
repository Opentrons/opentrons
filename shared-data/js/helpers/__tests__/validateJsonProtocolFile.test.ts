// json protocol file validator tests
import fixtureV1JsonProtocol from '../../../protocol/fixtures/1/simple.json'
import fixtureV3JsonProtocol from '../../../protocol/fixtures/3/simple.json'
import fixtureV4JsonProtocol from '../../../protocol/fixtures/4/simpleV4.json'
import fixtureV5JsonProtocol from '../../../protocol/fixtures/5/simpleV5.json'
import { validateJsonProtocolFile } from '../validateJsonProtocolFile'

const PYTHON_FILE = new File(
  [new Blob(undefined, { type: 'application/json' })],
  'fake_protocol.py'
)
const EMPTY_JSON_FILE = new File(
  [
    new Blob([], {
      type: 'application/json',
    }),
  ],
  'fake_protocol.json'
)
const INVALID_FILE = new File(
  [
    new Blob([JSON.stringify(fixtureV1JsonProtocol)], {
      type: 'application/json',
    }),
  ],
  'protocolFixtureInvalid.json'
)
const V3File = new File(
  [
    new Blob([JSON.stringify(fixtureV3JsonProtocol)], {
      type: 'application/json',
    }),
  ],
  'protocolFixtureV3.json'
)
const V4File = new File(
  [
    new Blob([JSON.stringify(fixtureV4JsonProtocol)], {
      type: 'application/json',
    }),
  ],
  'protocolFixtureV4.json'
)
const V5File = new File(
  [
    new Blob([JSON.stringify(fixtureV5JsonProtocol)], {
      type: 'application/json',
    }),
  ],
  'protocolFixtureV5.json'
)
interface TestSpec {
  name: string
  params: Parameters<typeof validateJsonProtocolFile>
  expected: unknown
}
describe('validateJsonProtocolFile', () => {
  let handleError: jest.MockedFunction<any>
  let handleSuccess: jest.MockedFunction<any>
  beforeEach(() => {
    handleError = jest.fn()
    handleSuccess = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const SPECS: TestSpec[] = [
    {
      name: 'validate schemaV3 JSON protocol',
      params: [V3File],
      expected: fixtureV3JsonProtocol,
    },
    {
      name: 'validate schemaV4 JSON protocol',
      params: [V4File],
      expected: fixtureV4JsonProtocol,
    },
    {
      name: 'validate schemaV5 JSON protocol',
      params: [V5File],
      expected: fixtureV5JsonProtocol,
    },
  ]

  SPECS.forEach(s => {
    it(`should ${s.name}`, () => {
      expect.assertions(1)

      return validateJsonProtocolFile(...s.params).then(e =>
        expect(e).toStrictEqual(s.expected)
      )
    })
  })

  it('should call handleError with INVALID_FILE_TYPE if extension is not .json', () => {
    expect.assertions(1)
    const options = { handleError, handleSuccess }
    return validateJsonProtocolFile(PYTHON_FILE, options).catch(() => {
      expect(handleError).toBeCalledWith('INVALID_FILE_TYPE')
    })
  })

  it('should call handleError with INVALID_FILE_TYPE if empty json', () => {
    expect.assertions(1)
    const options = { handleError, handleSuccess }
    return validateJsonProtocolFile(EMPTY_JSON_FILE, options).catch(() => {
      expect(handleError).toBeCalledWith(
        'INVALID_JSON_FILE',
        expect.any(SyntaxError)
      )
    })
  })

  it('should call handleError with INVALID_JSON_FILE if json does not validate against schema', () => {
    expect.assertions(1)
    const options = { handleError, handleSuccess }
    return validateJsonProtocolFile(INVALID_FILE, options).catch(() => {
      expect(handleError).toBeCalledWith('INVALID_JSON_FILE', expect.any(Array))
    })
  })

  it('should call handleSuccess with parsedProtocol if json parses and validates against schema', () => {
    expect.assertions(1)
    const options = { handleError, handleSuccess }
    return validateJsonProtocolFile(V5File, options).then(() => {
      expect(handleSuccess).toBeCalledWith(fixtureV5JsonProtocol)
    })
  })

  it('should call handleError with INVALID_JSON_FILE if json is not parseable', () => {
    JSON.parse = jest.fn().mockImplementationOnce(() => {
      throw 'not parseable as JSON'
    })
    expect.assertions(1)
    const options = { handleError, handleSuccess }
    return validateJsonProtocolFile(EMPTY_JSON_FILE, options).catch(() => {
      expect(handleError).toBeCalledWith(
        'INVALID_JSON_FILE',
        'not parseable as JSON'
      )
    })
  })
})
