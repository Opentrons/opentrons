import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { renderHook } from '@testing-library/react-hooks'

import { useSortedProtocols } from '../hooks'
import { StoredProtocolData } from '../../../redux/protocol-storage'

import type { Store } from 'redux'
import type { State } from '../../../redux/types'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

const mockStoredProtocolData = [
  {
    protocolKey: '26ed5a82-502f-4074-8981-57cdda1d066d',
    modified: 1651613783762.9993,
    srcFileNames: ['secondProtocol.json'],
    srcFiles: [],
    mostRecentAnalysis: {
      createdAt: '2022-05-03T21:36:12.494778+00:00',
      files: [
        {
          name: 'secondProtocol.json',
          role: 'main',
        },
      ],
      config: {
        protocolType: 'json',
        schemaVersion: 6,
      },
      metadata: {
        author: 'Otie',
        description: 'another mock protocol',
        created: 1606853851893,
        lastModified: 1619792954015,
        tags: [],
      },
      commands: [],
      liquids: [],
      errors: [],
    } as ProtocolAnalysisOutput,
  },
  {
    protocolKey: '3dc99ffa-f85e-4c01-ab0a-edecff432dac',
    modified: 1652339310312.1985,
    srcFileNames: ['testProtocol.json'],
    srcFiles: [],
    mostRecentAnalysis: {
      createdAt: '2022-05-10T17:04:43.132768+00:00',
      files: [
        {
          name: 'testProtocol.json',
          role: 'main',
        },
      ],
      config: {
        protocolType: 'json',
        schemaVersion: 6,
      },
      metadata: {
        protocolName: 'Third protocol',
        author: 'engineering',
        description: 'A short mock protocol',
        created: 1223131231,
        tags: ['unitTest'],
      },
      commands: [],
      liquids: [],
      errors: [],
    } as ProtocolAnalysisOutput,
  },
  {
    protocolKey: 'f130337e-68ad-4b5d-a6d2-cbc20515b1f7',
    modified: 1651688428961.8438,
    srcFileNames: ['demo.py'],
    srcFiles: [],
    mostRecentAnalysis: {
      createdAt: '2022-05-04T18:20:21.526508+00:00',
      files: [
        {
          name: 'demo.py',
          role: 'main',
        },
      ],
      config: {
        protocolType: 'python',
        apiVersion: [2, 10],
      },
      metadata: {
        protocolName: 'First protocol',
        author: 'Otie',
        source: 'Custom Protocol Request',
        apiLevel: '2.10',
      },
      commands: [],
      liquids: [],
      errors: [],
    } as ProtocolAnalysisOutput,
  },
] as StoredProtocolData[]

describe('useSortedProtocols', () => {
  const store: Store<State> = createStore(jest.fn(), {})
  beforeEach(() => {
    store.dispatch = jest.fn()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return an object with protocols sorted alphabetically', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )

    const { result } = renderHook(
      () => useSortedProtocols('alphabetical', mockStoredProtocolData),
      { wrapper }
    )
    const firstProtocol = result.current[0]
    const secondProtocol = result.current[1]
    const thirdProtocol = result.current[2]

    expect(firstProtocol.protocolKey).toBe(
      'f130337e-68ad-4b5d-a6d2-cbc20515b1f7'
    )
    expect(secondProtocol.protocolKey).toBe(
      '26ed5a82-502f-4074-8981-57cdda1d066d'
    )
    expect(thirdProtocol.protocolKey).toBe(
      '3dc99ffa-f85e-4c01-ab0a-edecff432dac'
    )
  })

  it('should return an object with protocols sorted reverse alphabetically', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )

    const { result } = renderHook(
      () => useSortedProtocols('reverse', mockStoredProtocolData),
      { wrapper }
    )
    const firstProtocol = result.current[0]
    const secondProtocol = result.current[1]
    const thirdProtocol = result.current[2]

    expect(firstProtocol.protocolKey).toBe(
      '3dc99ffa-f85e-4c01-ab0a-edecff432dac'
    )
    expect(secondProtocol.protocolKey).toBe(
      '26ed5a82-502f-4074-8981-57cdda1d066d'
    )
    expect(thirdProtocol.protocolKey).toBe(
      'f130337e-68ad-4b5d-a6d2-cbc20515b1f7'
    )
  })

  it('should return an object with protocols sorted by most recent modified data', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )

    const { result } = renderHook(
      () => useSortedProtocols('recent', mockStoredProtocolData),
      { wrapper }
    )
    const firstProtocol = result.current[0]
    const secondProtocol = result.current[1]
    const thirdProtocol = result.current[2]

    expect(firstProtocol.protocolKey).toBe(
      '3dc99ffa-f85e-4c01-ab0a-edecff432dac'
    )
    expect(secondProtocol.protocolKey).toBe(
      'f130337e-68ad-4b5d-a6d2-cbc20515b1f7'
    )
    expect(thirdProtocol.protocolKey).toBe(
      '26ed5a82-502f-4074-8981-57cdda1d066d'
    )
  })

  it('should return an object with protocols sorted by oldest modified data', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )

    const { result } = renderHook(
      () => useSortedProtocols('oldest', mockStoredProtocolData),
      { wrapper }
    )
    const firstProtocol = result.current[0]
    const secondProtocol = result.current[1]
    const thirdProtocol = result.current[2]

    expect(firstProtocol.protocolKey).toBe(
      '26ed5a82-502f-4074-8981-57cdda1d066d'
    )
    expect(secondProtocol.protocolKey).toBe(
      'f130337e-68ad-4b5d-a6d2-cbc20515b1f7'
    )
    expect(thirdProtocol.protocolKey).toBe(
      '3dc99ffa-f85e-4c01-ab0a-edecff432dac'
    )
  })
})
