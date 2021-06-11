// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import { ListLabwareCard } from '..'
import ListCard from '../ListCard'
import LabwareItem from '../LabwareItem'
import * as LabwareSelectors from '../../../custom-labware/selectors'
import * as LabwareActions from '../../../custom-labware/actions'

import type { State } from '../../../types'

jest.mock('../../../custom-labware/selectors')

const getValidCustomLabware: JestMockFn<
  [State],
  $Call<typeof LabwareSelectors.getValidCustomLabware, State>
> = LabwareSelectors.getValidCustomLabware

describe('ListLabwareCard', () => {
  let mockStore
  let render

  beforeEach(() => {
    jest.useFakeTimers()
    getValidCustomLabware.mockReturnValue([])

    mockStore = {
      getState: () => ({}),
      dispatch: jest.fn(),
      subscribe: jest.fn(),
    }

    render = () => {
      return mount(
        <Provider store={mockStore}>
          <ListLabwareCard />
        </Provider>
      )
    }
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.resetAllMocks()
    jest.useRealTimers()
  })

  test('renders a ListCard', () => {
    const tree = render()
    expect(tree.find(ListCard)).toHaveLength(1)
  })

  test('renders a LabwareItem for each valid labware', () => {
    getValidCustomLabware.mockReturnValue([
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'a.json',
        created: 1,
        identity: { name: 'a', namespace: 'custom', version: 1 },
        metadata: {
          displayName: 'A',
          displayCategory: 'wellPlate',
          displayVolumeUnits: 'mL',
        },
      },
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'e.json',
        created: 5,
        identity: { name: 'e', namespace: 'custom', version: 1 },
        metadata: {
          displayName: 'E',
          displayCategory: 'reservoir',
          displayVolumeUnits: 'mL',
        },
      },
    ])

    const tree = render()
    expect(tree.find(LabwareItem)).toHaveLength(2)
  })

  test('maps VALID_LABWARE_FILE to LabwareItem props', () => {
    getValidCustomLabware.mockReturnValue([
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'a.json',
        created: 1,
        identity: { name: 'a', namespace: 'custom', version: 2 },
        metadata: {
          displayName: 'A',
          displayCategory: 'wellPlate',
          displayVolumeUnits: 'mL',
        },
      },
    ])

    const item = render()
      .find(LabwareItem)
      .first()

    expect(item.props()).toEqual({
      name: 'a',
      version: 2,
      displayName: 'A',
      displayCategory: 'wellPlate',
      dateAdded: 1,
    })
  })

  test('dispatches FETCH_CUSTOM_LABWARE on mount and an interval', () => {
    const expected = LabwareActions.fetchCustomLabware()

    render()
    jest.advanceTimersByTime(5000 * 3)

    expect(mockStore.dispatch).toHaveBeenCalledTimes(4)
    expect(mockStore.dispatch).toHaveBeenNthCalledWith(1, expected)
    expect(mockStore.dispatch).toHaveBeenNthCalledWith(2, expected)
    expect(mockStore.dispatch).toHaveBeenNthCalledWith(3, expected)
    expect(mockStore.dispatch).toHaveBeenNthCalledWith(4, expected)
  })
})
