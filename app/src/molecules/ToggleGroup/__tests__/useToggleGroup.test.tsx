import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { useTrackEvent } from '../../../redux/analytics'
import { useToggleGroup } from '../useToggleGroup'

import type { Store } from 'redux'
import type { State } from '../../../redux/types'

jest.mock('../../../redux/analytics')

const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
let mockTrackEvent: jest.Mock

describe('useToggleGroup', () => {
  const store: Store<State> = createStore(jest.fn(), {})
  beforeEach(() => {
    mockTrackEvent = jest.fn()
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
    store.dispatch = jest.fn()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return default selectedValue and toggle buttons', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )

    const { result } = renderHook(
      () => useToggleGroup('List View', 'Map View'),
      { wrapper }
    )

    expect(result.current[0]).toBe('List View')
  })
})
