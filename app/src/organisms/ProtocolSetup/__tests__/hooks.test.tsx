// tests for the HostConfig context and hook
import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { useProtocolMetadata, useLabwareDefinitionUri } from '../hooks'
import { useCurrentProtocolRun } from '../../ProtocolUpload/hooks'
import { useProtocolDetails } from '../../RunDetails/hooks'

import type { Store } from 'redux'
import type { State } from '../../../redux/types'

jest.mock('../../ProtocolUpload/hooks')
jest.mock('../../RunDetails/hooks')

const mockUseCurrentProtocolRun = useCurrentProtocolRun as jest.MockedFunction<
  typeof useCurrentProtocolRun
>

const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>

describe('useProtocolMetadata', () => {
  const store: Store<State> = createStore(jest.fn(), {})

  when(mockUseCurrentProtocolRun)
    .calledWith()
    .mockReturnValue({
      protocolRecord: {
        data: {
          protocolType: 'json',
          metadata: {
            author: 'AUTHOR',
            description: 'DESCRIPTION',
            lastModified: 123456,
          },
        },
      },
      runRecord: {},
      createProtocolRun: jest.fn(),
    } as any)

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
    const { author, lastUpdated, creationMethod, description } = result.current

    expect(author).toBe('AUTHOR')
    expect(lastUpdated).toBe(123456)
    expect(creationMethod).toBe('json')
    expect(description).toBe('DESCRIPTION')
  })
})

// NOTE: this test and util should be deleted once we have a better identifier to look up labware offsets
// for now, this mapper will just strip the "id" out of labwareDefinitionIds so consumers don't need to worry
// about the concept of labwareDefinitionIds vs labwareDefinitionUris
describe('useLabwareDefinitionUri', () => {
  const MOCK_LABWARE_ID = 'some_labware'
  const MOCK_DEFINITION_URI = 'some_labware_definition_uri'
  beforeEach(() => {
    when(mockUseProtocolDetails)
      .calledWith()
      .mockReturnValue({
        protocolData: {
          labware: {
            [MOCK_LABWARE_ID]: {
              definitionId: `${MOCK_DEFINITION_URI}_id`,
              displayName: 'some dope labware',
            },
          },
        },
      } as any)
  })
  afterEach(() => {
    jest.restoreAllMocks()
    resetAllWhenMocks()
  })
  it('should return the definition uri of a given labware', () => {
    const { result } = renderHook(() =>
      useLabwareDefinitionUri(MOCK_LABWARE_ID)
    )
    expect(result.current).toBe(MOCK_DEFINITION_URI)
  })
})
