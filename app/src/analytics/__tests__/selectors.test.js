// @flow

import * as Protocol from '../../protocol'
import * as Hash from '../hash'

import { getProtocolAnalyticsData } from '../selectors'

import type { State } from '../../types'

jest.mock('../../protocol/selectors')
jest.mock('../hash')

describe('analytics selectors', () => {
  let mockState: State

  beforeEach(() => {
    mockState = ({ mockState: true }: any)
  })

  afterEach(() => {
    jest.resetAllMocks()
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

    beforeEach(() => {
      hash.mockImplementation(source => Promise.resolve(`hash:${source}`))
      getProtocolType.mockReturnValue(null)
      getProtocolCreatorApp.mockReturnValue({ name: null, version: null })
      getProtocolApiVersion.mockReturnValue(null)
      getProtocolName.mockReturnValue(null)
      getProtocolSource.mockReturnValue(null)
      getProtocolAuthor.mockReturnValue(null)
      getProtocolContents.mockReturnValue(null)
    })

    it('should have information about the protocol', () => {
      const result = getProtocolAnalyticsData(mockState)

      return expect(result).resolves.toEqual({
        protocolType: '',
        protocolAppName: '',
        protocolAppVersion: '',
        protocolApiVersion: '',
        protocolName: '',
        protocolSource: '',
        protocolAuthor: '',
        protocolText: '',
      })
    })

    it('should pass metadata through unhashed', () => {
      getProtocolType.mockReturnValue(Protocol.TYPE_JSON)
      getProtocolCreatorApp.mockReturnValue({ name: 'Foo', version: '9.8.7' })
      getProtocolApiVersion.mockReturnValue('2.3')
      getProtocolName.mockReturnValue('Awesome Protocol')
      getProtocolSource.mockReturnValue('Opentrons Test')

      return getProtocolAnalyticsData(mockState).then(result => {
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

      return getProtocolAnalyticsData(mockState).then(result => {
        expect(getProtocolAuthor).toHaveBeenCalledWith(mockState)
        expect(getProtocolContents).toHaveBeenCalledWith(mockState)

        expect(result).toMatchObject({
          protocolAuthor: 'hash:Private Author',
          protocolText: 'hash:Private Contents',
        })
      })
    })
  })
})
