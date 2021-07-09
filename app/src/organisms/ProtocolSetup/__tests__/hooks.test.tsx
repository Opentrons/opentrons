// tests for the HostConfig context and hook
import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { useProtocolMetadata } from '../hooks'
import * as protocolSelectors from '../../../redux/protocol/selectors'

import type { Store } from 'redux'
import type { State } from '../../../redux/types'

jest.mock('../../../redux/protocol/selectors')

const getProtocolAuthor = protocolSelectors.getProtocolAuthor as jest.MockedFunction<
  typeof protocolSelectors.getProtocolAuthor
>
const getProtocolLastUpdated = protocolSelectors.getProtocolLastUpdated as jest.MockedFunction<
  typeof protocolSelectors.getProtocolLastUpdated
>
const getProtocolMethod = protocolSelectors.getProtocolMethod as jest.MockedFunction<
  typeof protocolSelectors.getProtocolMethod
>
const getProtocolDescription = protocolSelectors.getProtocolDescription as jest.MockedFunction<
  typeof protocolSelectors.getProtocolDescription
>

describe('useProtocolMetadata', () => {
  const store: Store<State> = createStore(jest.fn(), {})

  getProtocolAuthor.mockReturnValue('author name')
  getProtocolLastUpdated.mockReturnValue(8675309)
  getProtocolMethod.mockReturnValue('imaginary editor')
  getProtocolDescription.mockReturnValue('stubbed protocol description')

  beforeEach(() => {
    store.dispatch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return author, lastUpdated, method, and description from redux selectors', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(useProtocolMetadata, { wrapper })
    const { author, lastUpdated, method, description } = result.current

    expect(author).toBe('author name')
    expect(lastUpdated).toBe(8675309)
    expect(method).toBe('imaginary editor')
    expect(description).toBe('stubbed protocol description')
  })
})
