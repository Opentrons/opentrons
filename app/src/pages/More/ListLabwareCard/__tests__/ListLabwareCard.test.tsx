import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import { ListLabwareCard } from '..'
import { LabwareList } from '../LabwareList'
import * as LabwareFixtures from '../../../../redux/custom-labware/__fixtures__'
import * as LabwareSelectors from '../../../../redux/custom-labware/selectors'
import * as LabwareActions from '../../../../redux/custom-labware/actions'

jest.mock('../../../../redux/custom-labware/selectors')

const mockGetCustomLabware = LabwareSelectors.getCustomLabware as jest.MockedFunction<
  typeof LabwareSelectors.getCustomLabware
>

const mockGetListLabwareErrorMessage = LabwareSelectors.getListLabwareErrorMessage as jest.MockedFunction<
  typeof LabwareSelectors.getListLabwareErrorMessage
>

describe('ListLabwareCard', () => {
  let mockStore: any
  let render: () => ReturnType<typeof mount>

  beforeEach(() => {
    jest.useFakeTimers()
    mockGetCustomLabware.mockReturnValue([])
    mockGetListLabwareErrorMessage.mockReturnValue(null)

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

  it('renders a LabwareList', () => {
    const tree = render()
    expect(tree.find(LabwareList)).toHaveLength(1)
  })

  it('passes labware list and list error to LabwareList', () => {
    mockGetCustomLabware.mockReturnValue([
      LabwareFixtures.mockValidLabware,
      LabwareFixtures.mockInvalidLabware,
    ])

    mockGetListLabwareErrorMessage.mockReturnValue('AH!!!')

    const tree = render()
    expect(tree.find(LabwareList).props()).toEqual({
      labware: [
        LabwareFixtures.mockValidLabware,
        LabwareFixtures.mockInvalidLabware,
      ],
      errorMessage: 'AH!!!',
    })
  })

  it('dispatches FETCH_CUSTOM_LABWARE on mount and an interval', () => {
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
