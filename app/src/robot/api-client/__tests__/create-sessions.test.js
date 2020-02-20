// session creation tests for the RPC API client
import EventEmitter from 'events'
import { client } from '../client'
import { Client as RpcClient } from '../../../rpc/client'
import { actions as RobotActions } from '../../actions'
import * as ProtocolSelectors from '../../../protocol/selectors'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as LabwareSelectors from '../../../custom-labware/selectors'
import { MockSession } from '../../test/__mocks__/session'

jest.mock('../../../rpc/client')
jest.mock('../../../protocol/selectors')
jest.mock('../../../discovery/selectors')
jest.mock('../../../custom-labware/selectors')

const mockState = { state: true }
const mockRobot = { name: 'robot-name', ip: '127.0.0.1', port: 31950 }

describe('RPC API client - session creation', () => {
  let mockRpcClient
  let mockSessionManager
  let mockDispatch
  let sendToClient

  beforeEach(() => {
    mockSessionManager = {
      session: null,
      clear: jest.fn(),
      create: jest.fn(),
      // added in API v3.15
      create_from_bundle: jest.fn(),
      // added in API v3.15
      create_with_extra_labware: jest.fn(),
    }

    mockRpcClient = Object.assign(new EventEmitter(), {
      close: jest.fn(),
      remote: { session_manager: mockSessionManager },
    })

    mockDispatch = jest.fn()

    RpcClient.mockResolvedValue(mockRpcClient)
    DiscoverySelectors.getConnectableRobots.mockReturnValue([mockRobot])
    LabwareSelectors.getCustomLabwareDefinitions.mockReturnValue([])

    const _receive = client(mockDispatch)
    const _flush = () => new Promise(resolve => setTimeout(resolve, 0))

    sendToClient = action => {
      _receive(mockState, action)
      return _flush()
    }

    return sendToClient(RobotActions.connect(mockRobot.name))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('calls session_manager.create on protocol:UPLOAD', () => {
    const mockProtocolFile = { name: 'protocol.py' }
    const mockSession = MockSession()

    ProtocolSelectors.getProtocolFile.mockReturnValue(mockProtocolFile)
    mockSessionManager.create.mockResolvedValue(mockSession)

    return sendToClient({
      type: 'protocol:UPLOAD',
      payload: { contents: '# protocol', data: null },
      meta: { robot: true },
    }).then(() => {
      expect(ProtocolSelectors.getProtocolFile).toHaveBeenCalledWith(mockState)
      expect(mockSessionManager.create).toHaveBeenCalledWith(
        mockProtocolFile.name,
        '# protocol'
      )
    })
  })

  test('calls session_manager.create_from_bundle if zip protocol', () => {
    const mockProtocolFile = { name: 'protocol.zip', type: 'zip' }
    const mockSession = MockSession()

    ProtocolSelectors.getProtocolFile.mockReturnValue(mockProtocolFile)
    mockSessionManager.create_from_bundle.mockResolvedValue(mockSession)

    return sendToClient({
      type: 'protocol:UPLOAD',
      payload: { contents: 'binary-data', data: null },
      meta: { robot: true },
    }).then(() => {
      expect(mockSessionManager.create_from_bundle).toHaveBeenCalledWith(
        mockProtocolFile.name,
        'binary-data'
      )
    })
  })

  test('calls create with third param if zip and create_from_bundle not available', () => {
    const mockProtocolFile = { name: 'protocol.zip', type: 'zip' }
    const mockSession = MockSession()

    delete mockSessionManager.create_from_bundle

    ProtocolSelectors.getProtocolFile.mockReturnValue(mockProtocolFile)
    mockSessionManager.create.mockResolvedValue(mockSession)

    return sendToClient({
      type: 'protocol:UPLOAD',
      payload: { contents: 'binary-data', data: null },
      meta: { robot: true },
    }).then(() => {
      expect(mockSessionManager.create).toHaveBeenCalledWith(
        mockProtocolFile.name,
        'binary-data',
        true
      )
    })
  })

  test('calls create_with_extra_labware if python protocol and custom labware exist', () => {
    const mockProtocolFile = { name: 'protocol.py', type: 'python' }
    const mockSession = MockSession()

    ProtocolSelectors.getProtocolFile.mockReturnValue(mockProtocolFile)
    LabwareSelectors.getCustomLabwareDefinitions.mockReturnValue([
      { mockLabware: 1 },
      { mockLabware: 2 },
    ])
    mockSessionManager.create_with_extra_labware.mockResolvedValue(mockSession)

    return sendToClient({
      type: 'protocol:UPLOAD',
      payload: { contents: '# protocol', data: null },
      meta: { robot: true },
    }).then(() => {
      expect(mockSessionManager.create_with_extra_labware).toHaveBeenCalledWith(
        mockProtocolFile.name,
        '# protocol',
        [{ v: { mockLabware: 1 } }, { v: { mockLabware: 2 } }]
      )
    })
  })

  test('calls create if custom labware but create_with_extra_labware not available', () => {
    const mockProtocolFile = { name: 'protocol.py', type: 'python' }
    const mockSession = MockSession()

    delete mockSessionManager.create_with_extra_labware

    ProtocolSelectors.getProtocolFile.mockReturnValue(mockProtocolFile)
    LabwareSelectors.getCustomLabwareDefinitions.mockReturnValue([
      { mockLabware: 1 },
      { mockLabware: 2 },
    ])
    mockSessionManager.create.mockResolvedValue(mockSession)

    return sendToClient({
      type: 'protocol:UPLOAD',
      payload: { contents: '# protocol', data: null },
      meta: { robot: true },
    }).then(() => {
      expect(mockSessionManager.create).toHaveBeenCalledWith(
        mockProtocolFile.name,
        '# protocol'
      )
    })
  })

  test('calls create if custom labware but protocol is JSON', () => {
    const mockProtocolFile = { name: 'protocol.json', type: 'json' }
    const mockSession = MockSession()

    ProtocolSelectors.getProtocolFile.mockReturnValue(mockProtocolFile)
    LabwareSelectors.getCustomLabwareDefinitions.mockReturnValue([
      { mockLabware: 1 },
      { mockLabware: 2 },
    ])
    mockSessionManager.create.mockResolvedValue(mockSession)

    return sendToClient({
      type: 'protocol:UPLOAD',
      payload: { contents: '{}', data: {} },
      meta: { robot: true },
    }).then(() => {
      expect(mockSessionManager.create).toHaveBeenCalledWith(
        mockProtocolFile.name,
        '{}'
      )
    })
  })

  test('dispatches session response with error if create throws', () => {
    const mockProtocolFile = { name: 'protocol.py', type: 'python' }

    ProtocolSelectors.getProtocolFile.mockReturnValue(mockProtocolFile)
    mockSessionManager.create.mockRejectedValue(new Error('AH'))

    return sendToClient({
      type: 'protocol:UPLOAD',
      payload: { contents: '{}', data: {} },
      meta: { robot: true },
    }).then(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        RobotActions.sessionResponse(new Error('AH'), null, true)
      )
    })
  })

  test('dispatches helpful error response with if create throws with bundle', () => {
    const mockProtocolFile = { name: 'protocol.zip', type: 'zip' }
    const mockError = Object.assign(
      new Error(
        'TypeError: create() takes 3 positional arguments but 4 were given'
      ),
      {
        methodName: 'create',
      }
    )

    delete mockSessionManager.create_from_bundle

    ProtocolSelectors.getProtocolFile.mockReturnValue(mockProtocolFile)
    mockSessionManager.create.mockRejectedValue(mockError)

    return sendToClient({
      type: 'protocol:UPLOAD',
      payload: { contents: 'binary-data', data: null },
      meta: { robot: true },
    }).then(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        RobotActions.sessionResponse(
          expect.objectContaining({
            message: expect.stringMatching(
              /does not support ZIP protocol bundles/
            ),
          }),
          null,
          true
        )
      )
    })
  })
})
