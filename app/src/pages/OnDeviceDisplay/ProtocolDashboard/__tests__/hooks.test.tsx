import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { renderHook } from '@testing-library/react-hooks'

import { useSortProtocols } from '../hooks'

import type { Store } from 'redux'
import type { ProtocolResource } from '@opentrons/shared-data'
import type { RunData } from '@opentrons/api-client'
import type { State } from '../../../../redux/types'

const mockProtocols = [
  {
    id: 'mockProtocol1',
    createdAt: '2022-05-03T21:36:12.494778+00:00',
    protocolType: 'json',
    metadata: {
      protocolName: 'yay mock protocol',
      author: 'engineering',
      description: 'A short mock protocol',
      created: 1606853851893,
      tags: ['unitTest'],
    },
    analysisSummaries: [],
    files: [],
    key: '26ed5a82-502f-4074-8981-57cdda1d066d',
  },
  {
    id: 'mockProtocol2',
    createdAt: '2022-05-10T17:04:43.132768+00:00',
    protocolType: 'json',
    metadata: {
      protocolName: 'hello mock protocol',
      author: 'engineering',
      description: 'A short mock protocol',
      created: 1223131231,
      tags: ['unitTest'],
    },
    analysisSummaries: [],
    files: [],
    key: '3dc99ffa-f85e-4c01-ab0a-edecff432dac',
  },
  {
    id: 'mockProtocol3',
    createdAt: '2022-06-04T18:20:21.526508+00:00',
    protocolType: 'json',
    metadata: {
      protocolName: 'mock protocol',
      author: 'engineering',
      description: 'A short mock protocol',
      created: 1223451231,
      tags: ['unitTest'],
    },
    analysisSummaries: [],
    files: [],
    key: 'f130337e-68ad-4b5d-a6d2-cbc20515b1f7',
  },
] as ProtocolResource[]

const mockRuns = [
  {
    id: 'mockLastRun1',
    createdAt: '2022-06-04T18:20:21.526508+00:00',
    completedAt: '2022-07-04T18:20:21.526508+00:00',
    current: false,
    status: 'succeeded',
    errors: {},
    pipettes: {},
    labware: {},
    protocolId: 'mockProtocol3',
    labwareOffsets: {},
  },
  {
    id: 'mockLastRun2',
    createdAt: '2022-05-10T17:04:43.132768+00:00',
    completedAt: '2022-10-10T17:04:43.132768+00:00',
    current: false,
    status: 'succeeded',
    errors: {},
    pipettes: {},
    labware: {},
    protocolId: 'mockProtocol2',
    labwareOffsets: {},
  },
  {
    id: 'mockLastRun3',
    createdAt: '2022-05-03T21:36:12.494778+00:00',
    completedAt: '2022-05-13T21:36:12.494778+00:00',
    current: false,
    status: 'succeeded',
    errors: {},
    pipettes: {},
    labware: {},
    protocolId: 'mockProtocol1',
    labwareOffsets: {},
  },
] as RunData[]

describe('useSortProtocols', () => {
  const store: Store<State> = createStore(jest.fn(), {})
  beforeEach(() => {
    store.dispatch = jest.fn()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should return sorted protocols by protocol name a->z alphabetical', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(
      () => useSortProtocols('alphabetical', mockProtocols, mockRuns),
      { wrapper }
    )
    const firstProtocol = result.current[0]
    const secondProtocol = result.current[1]
    const thirdProtocol = result.current[2]

    expect(firstProtocol.metadata.protocolName).toBe('hello mock protocol')
    expect(secondProtocol.metadata.protocolName).toBe('mock protocol')
    expect(thirdProtocol.metadata.protocolName).toBe('yay mock protocol')
  })

  it('should return sorted protocols by protocol name z->a reverse', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(
      () => useSortProtocols('reverse', mockProtocols, mockRuns),
      { wrapper }
    )
    const firstProtocol = result.current[0]
    const secondProtocol = result.current[1]
    const thirdProtocol = result.current[2]

    expect(firstProtocol.metadata.protocolName).toBe('yay mock protocol')
    expect(secondProtocol.metadata.protocolName).toBe('mock protocol')
    expect(thirdProtocol.metadata.protocolName).toBe('hello mock protocol')
  })

  it('should return sorted protocols by last run recent->old recentRun', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(
      () => useSortProtocols('recentRun', mockProtocols, mockRuns),
      { wrapper }
    )
    const firstProtocol = result.current[0]
    const secondProtocol = result.current[1]
    const thirdProtocol = result.current[2]

    expect(firstProtocol.metadata.protocolName).toBe('hello mock protocol')
    expect(secondProtocol.metadata.protocolName).toBe('mock protocol')
    expect(thirdProtocol.metadata.protocolName).toBe('yay mock protocol')
  })

  it('should return sorted protocols by last run old->recent oldRun', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(
      () => useSortProtocols('oldRun', mockProtocols, mockRuns),
      { wrapper }
    )
    const firstProtocol = result.current[0]
    const secondProtocol = result.current[1]
    const thirdProtocol = result.current[2]

    expect(firstProtocol.metadata.protocolName).toBe('yay mock protocol')
    expect(secondProtocol.metadata.protocolName).toBe('mock protocol')
    expect(thirdProtocol.metadata.protocolName).toBe('hello mock protocol')
  })

  it('should return sorted protocols by date added recent->old recentCreated', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(
      () => useSortProtocols('recentCreated', mockProtocols, mockRuns),
      { wrapper }
    )
    const firstProtocol = result.current[0]
    const secondProtocol = result.current[1]
    const thirdProtocol = result.current[2]

    expect(firstProtocol.metadata.protocolName).toBe('mock protocol')
    expect(secondProtocol.metadata.protocolName).toBe('hello mock protocol')
    expect(thirdProtocol.metadata.protocolName).toBe('yay mock protocol')
  })

  it('should return sorted protocols by date added old->recent oldCreated', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(
      () => useSortProtocols('oldCreated', mockProtocols, mockRuns),
      { wrapper }
    )
    const firstProtocol = result.current[0]
    const secondProtocol = result.current[1]
    const thirdProtocol = result.current[2]

    expect(firstProtocol.metadata.protocolName).toBe('yay mock protocol')
    expect(secondProtocol.metadata.protocolName).toBe('hello mock protocol')
    expect(thirdProtocol.metadata.protocolName).toBe('mock protocol')
  })
})
