// tests for the HostConfig context and hook
import * as React from 'react'
import { when } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { useCurrentProtocol } from '../../../ProtocolUpload/hooks'
import { useProtocolMetadata } from '../useProtocolMetadata'

import type { Store } from 'redux'
import type { State } from '../../../../redux/types'

jest.mock('../../../ProtocolUpload/hooks')

const mockUseCurrentProtocol = useCurrentProtocol as jest.MockedFunction<
  typeof useCurrentProtocol
>

describe('useProtocolMetadata', () => {
  const store: Store<State> = createStore(jest.fn(), {})

  when(mockUseCurrentProtocol)
    .calledWith()
    .mockReturnValue({
      data: {
        protocolType: 'json',
        robotType: 'OT-3 Standard',
        metadata: {
          author: 'AUTHOR',
          description: 'DESCRIPTION',
          lastModified: 123456,
        },
      },
    } as any)

  beforeEach(() => {
    store.dispatch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return author, lastUpdated, method, description, and robot type', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(useProtocolMetadata, { wrapper })
    const {
      author,
      lastUpdated,
      creationMethod,
      description,
      robotType,
    } = result.current

    expect(author).toBe('AUTHOR')
    expect(lastUpdated).toBe(123456)
    expect(creationMethod).toBe('json')
    expect(description).toBe('DESCRIPTION')
    expect(robotType).toBe('OT-3 Standard')
  })
})
