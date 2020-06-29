// @flow

import type { Config } from '../../config/types'
import * as Protocol from '../../protocol'
import * as RobotSelectors from '../../robot/selectors'
import type { State } from '../../types'
import * as Hash from '../hash'
import * as Selectors from '../selectors'

type MockState = $Shape<{| ...State, config: null | $Shape<Config> |}>

jest.mock('../../protocol/selectors')
jest.mock('../../robot/selectors')
jest.mock('../hash')

describe('analytics selectors', () => {
  let mockState: MockState

  beforeEach(() => {
    mockState = ({ mockState: true }: any)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('analytics config selectors', () => {
    it('should return null with getAnalyticsConfig if no config', () => {
      const mockState: MockState = { config: null }
      expect(Selectors.getAnalyticsConfig(mockState)).toBe(null)
    })

    it('should return config.analytics with getAnalyticsConfig', () => {
      const mockState: MockState = {
        config: {
          analytics: { appId: 'foobar', optedIn: true, seenOptIn: true },
        },
      }
      expect(Selectors.getAnalyticsConfig(mockState)).toEqual({
        appId: 'foobar',
        optedIn: true,
        seenOptIn: true,
      })
    })

    it('should return false with getAnalyticsOptedIn if no config', () => {
      const mockState: MockState = { config: null }
      expect(Selectors.getAnalyticsOptedIn(mockState)).toBe(false)
    })

    it('should return config.analytics.optedIn with getAnalyticsOptedIn', () => {
      const mockState: MockState = {
        config: {
          analytics: { appId: 'foobar', optedIn: true, seenOptIn: true },
        },
      }
      expect(Selectors.getAnalyticsOptedIn(mockState)).toBe(true)
    })

    it('should return true for getAnalyticsOptInSeen if no config', () => {
      const mockState: MockState = { config: null }
      expect(Selectors.getAnalyticsOptInSeen(mockState)).toBe(true)
    })

    it('should return config.analytics.seenOptIn with getAnalyticsOptInSeen', () => {
      const mockState: MockState = {
        config: {
          analytics: { appId: 'foobar', optedIn: false, seenOptIn: false },
        },
      }
      expect(Selectors.getAnalyticsOptInSeen(mockState)).toBe(false)
    })
  })

  describe('get protocol analytics data', () => {
    const hash: JestMockFn<[string], Promise<string>> = Hash.hash

    const getProtocolType: JestMockFn<
      [State],
      $Call<typeof Protocol.getProtocolType, State>
    > = Protocol.getProtocolType

    const getProtocolCreatorApp: JestMockFn<
      [State],
      $Call<typeof Protocol.getProtocolCreatorApp, State>
    > = Protocol.getProtocolCreatorApp

    const getProtocolApiVersion: JestMockFn<
      [State],
      $Call<typeof Protocol.getProtocolApiVersion, State>
    > = Protocol.getProtocolApiVersion

    const getProtocolName: JestMockFn<
      [State],
      $Call<typeof Protocol.getProtocolName, State>
    > = Protocol.getProtocolName

    const getProtocolSource: JestMockFn<
      [State],
      $Call<typeof Protocol.getProtocolSource, State>
    > = Protocol.getProtocolSource

    const getProtocolAuthor: JestMockFn<
      [State],
      $Call<typeof Protocol.getProtocolAuthor, State>
    > = Protocol.getProtocolAuthor

    const getProtocolContents: JestMockFn<
      [State],
      $Call<typeof Protocol.getProtocolContents, State>
    > = Protocol.getProtocolContents

    const getModules: JestMockFn<
      [State],
      $Call<typeof RobotSelectors.getModules, State>
    > = RobotSelectors.getModules

    const getPipettes: JestMockFn<
      [State],
      $Call<typeof RobotSelectors.getPipettes, State>
    > = RobotSelectors.getPipettes

    beforeEach(() => {
      hash.mockImplementation(source => Promise.resolve(`hash:${source}`))
      getProtocolType.mockReturnValue(null)
      getProtocolCreatorApp.mockReturnValue({ name: null, version: null })
      getProtocolApiVersion.mockReturnValue(null)
      getProtocolName.mockReturnValue(null)
      getProtocolSource.mockReturnValue(null)
      getProtocolAuthor.mockReturnValue(null)
      getProtocolContents.mockReturnValue(null)
      getModules.mockReturnValue([])
      getPipettes.mockReturnValue([])
    })

    it('should have information about the protocol', () => {
      const result = Selectors.getProtocolAnalyticsData(mockState)

      return expect(result).resolves.toEqual({
        protocolType: '',
        protocolAppName: '',
        protocolAppVersion: '',
        protocolApiVersion: '',
        protocolName: '',
        protocolSource: '',
        protocolAuthor: '',
        protocolText: '',
        pipettes: '',
        modules: '',
      })
    })

    it('should pass metadata through unhashed', () => {
      getProtocolType.mockReturnValue(Protocol.TYPE_JSON)
      getProtocolCreatorApp.mockReturnValue({ name: 'Foo', version: '9.8.7' })
      getProtocolApiVersion.mockReturnValue('2.3')
      getProtocolName.mockReturnValue('Awesome Protocol')
      getProtocolSource.mockReturnValue('Opentrons Test')

      return Selectors.getProtocolAnalyticsData(mockState).then(result => {
        expect(getProtocolType).toHaveBeenCalledWith(mockState)
        expect(getProtocolCreatorApp).toHaveBeenCalledWith(mockState)
        expect(getProtocolApiVersion).toHaveBeenCalledWith(mockState)
        expect(getProtocolName).toHaveBeenCalledWith(mockState)
        expect(getProtocolSource).toHaveBeenCalledWith(mockState)

        expect(result).toMatchObject({
          protocolType: Protocol.TYPE_JSON,
          protocolAppName: 'Foo',
          protocolAppVersion: '9.8.7',
          protocolApiVersion: '2.3',
          protocolName: 'Awesome Protocol',
          protocolSource: 'Opentrons Test',
        })
      })
    })

    it('should hash private data', () => {
      getProtocolAuthor.mockReturnValue('Private Author')
      getProtocolContents.mockReturnValue('Private Contents')

      return Selectors.getProtocolAnalyticsData(mockState).then(result => {
        expect(getProtocolAuthor).toHaveBeenCalledWith(mockState)
        expect(getProtocolContents).toHaveBeenCalledWith(mockState)

        expect(result).toMatchObject({
          protocolAuthor: 'hash:Private Author',
          protocolText: 'hash:Private Contents',
        })
      })
    })

    it('should collect pipette requestedAs (or actual) names', () => {
      getPipettes.mockReturnValue([
        {
          _id: 0,
          mount: 'left',
          channels: 8,
          name: 'p300_single_v2.0',
          tipRacks: [],
          requestedAs: 'p300_single',
          probed: true,
          tipOn: false,
          modelSpecs: null,
        },
        {
          _id: 1,
          mount: 'right',
          channels: 8,
          name: 'p20_multi_v2.0',
          tipRacks: [],
          requestedAs: null,
          probed: true,
          tipOn: false,
          modelSpecs: null,
        },
      ])

      const result = Selectors.getProtocolAnalyticsData(mockState)

      return expect(result).resolves.toMatchObject({
        pipettes: 'p300_single,p20_multi_v2.0',
      })
    })

    it('should collect module models', () => {
      getModules.mockReturnValue([
        { _id: 0, slot: '1', model: 'temperatureModuleV1' },
        { _id: 1, slot: '2', model: 'magneticModuleV2' },
      ])

      const result = Selectors.getProtocolAnalyticsData(mockState)

      return expect(result).resolves.toMatchObject({
        modules: 'temperatureModuleV1,magneticModuleV2',
      })
    })
  })
})
