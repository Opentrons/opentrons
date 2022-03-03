import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { getAllDefs } from '../helpers/getAllDefs'

import { getCustomLabware } from '../../../redux/custom-labware'
import {
  mockDefinition,
  mockValidLabware,
} from '../../../redux/custom-labware/__fixtures__'

import { useGetAllLabware } from '../hooks'

import type { Store } from 'redux'
import type { State } from '../../../redux/types'

jest.mock('../../../redux/custom-labware')
jest.mock('../helpers/getAllDefs')

const mockGetCustomLabware = getCustomLabware as jest.MockedFunction<
  typeof getCustomLabware
>
const mockGetAllAllDefs = getAllDefs as jest.MockedFunction<typeof getAllDefs>

describe('useGetAllLabware hook', () => {
  const store: Store<State> = createStore(jest.fn(), {})
  beforeEach(() => {
    mockGetAllAllDefs.mockReturnValue([mockDefinition])
    mockGetCustomLabware.mockReturnValue([mockValidLabware])
    store.dispatch = jest.fn()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return object with only definition and modified date', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(useGetAllLabware, { wrapper })
    const labware1 = result.current[0]
    const labware2 = result.current[1]

    expect(labware1.definition).toBe(mockDefinition)
    expect(labware2.modified).toBe(mockValidLabware.modified)
    expect(labware2.definition).toBe(mockValidLabware.definition)
  })
})
