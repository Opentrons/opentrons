import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { renderHook } from '@testing-library/react'
import { render, fireEvent } from '@testing-library/react'
import { act } from 'react-test-renderer'
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
    const wrapper: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )

    const { result } = renderHook(
      () => useToggleGroup('List View', 'Map View'),
      { wrapper }
    )

    expect(result.current[0]).toBe('List View')
  })
  it('should record an analytics event for list view', async () => {
    const wrapper: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )

    const { result } = renderHook(
      () => useToggleGroup('List View', 'Map View', 'fake event'),
      { wrapper }
    )

    const { getByText } = render(result.current[1] as any)
    const listViewButton = getByText('List View')
    act(() => {
      fireEvent.click(listViewButton)
    })
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: 'fake event',
      properties: { view: 'list' },
    })
  })
  it('should record an analytics event for map view', () => {
    const wrapper: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )

    const { result } = renderHook(
      () => useToggleGroup('List View', 'Map View', 'fake event'),
      { wrapper }
    )

    const { getByText } = render(result.current[1] as any)
    const mapViewButton = getByText('Map View')
    act(() => {
      fireEvent.click(mapViewButton)
    })
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: 'fake event',
      properties: { view: 'map' },
    })
  })
})
