import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import {
  nestedTextMatcher,
  renderWithProviders,
  SPACING,
  COLORS,
} from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import {
  useTrackEvent,
  ANALYTICS_HIGHLIGHT_LIQUID_IN_DETAIL_MODAL,
} from '../../../../../redux/analytics'
import { getIsOnDevice } from '../../../../../redux/config'
import { LiquidDetailCard } from '../LiquidDetailCard'

jest.mock('../../../../../redux/analytics')
jest.mock('../../../../../redux/config')

const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
const mockGetIsOnDevice = getIsOnDevice as jest.MockedFunction<
  typeof getIsOnDevice
>
const render = (props: React.ComponentProps<typeof LiquidDetailCard>) => {
  return renderWithProviders(<LiquidDetailCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}
let mockTrackEvent: jest.Mock

describe('LiquidDetailCard', () => {
  let props: React.ComponentProps<typeof LiquidDetailCard>

  beforeEach(() => {
    mockTrackEvent = jest.fn()
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
    mockGetIsOnDevice.mockReturnValue(false)
    props = {
      liquidId: '0',
      displayName: 'Mock Liquid',
      description: 'Mock Description',
      displayColor: '#FFF',
      volumeByWell: { A1: 50, B1: 50 },
      labwareWellOrdering: [
        ['A1', 'B1', 'C1', 'D1'],
        ['A2', 'B2', 'C2', 'D2'],
        ['A3', 'B3', 'C3', 'D3'],
      ],
      setSelectedValue: jest.fn(),
      selectedValue: '2',
    }
  })

  it('renders liquid name, description, total volume', () => {
    const { getByText, getAllByText } = render(props)
    getByText('Mock Liquid')
    getByText('Mock Description')
    getAllByText(nestedTextMatcher('100 µL'))
  })
  it('renders clickable box, clicking on it calls track event', () => {
    const { getByTestId } = render(props)
    fireEvent.click(getByTestId('LiquidDetailCard_box'))
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_HIGHLIGHT_LIQUID_IN_DETAIL_MODAL,
      properties: {},
    })
  })
  it('renders well volume information if selected', () => {
    const { getByText, getAllByText } = render({
      ...props,
      selectedValue: '0',
    })
    getByText('A1')
    getByText('B1')
    getAllByText(nestedTextMatcher('50 µL'))
  })
  it('renders well range for volume info if selected', () => {
    const { getByText } = render({
      ...props,
      selectedValue: '0',
      volumeByWell: { A1: 50, B1: 50, C1: 50, D1: 50 },
    })
    getByText('A1: D1')
    getByText(nestedTextMatcher('50 µL'))
  })
  it('renders liquid name, description, total volume for odd, and clicking item selects the box', () => {
    mockGetIsOnDevice.mockReturnValue(true)
    const { getByText, getAllByText, getByLabelText } = render(props)
    getByText('Mock Liquid')
    getByText('Mock Description')
    getAllByText(nestedTextMatcher('100 µL'))
    getAllByText(nestedTextMatcher('total volume'))
    expect(getByLabelText('liquidBox_odd')).toHaveStyle(
      `border: ${SPACING.spacing4} solid ${COLORS.grey30}`
    )
  })
})
