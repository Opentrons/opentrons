import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import * as RobotApi from '../../../redux/robot-api'
import { mockPipetteInfo } from '../../../redux/pipettes/__fixtures__'
import { fetchPipettes } from '../../../redux/pipettes'
import { CheckPipettesButton } from '../CheckPipettesButton'
import type { DispatchApiRequestType } from '../../../redux/robot-api'
import type { PipetteModelSpecs } from '@opentrons/shared-data'

jest.mock('../../../redux/robot-api')
jest.mock('../../../redux/pipettes')

const mockFetchPipettes = fetchPipettes as jest.MockedFunction<
  typeof fetchPipettes
>
const mockUseDispatchApiRequests = RobotApi.useDispatchApiRequests as jest.MockedFunction<
  typeof RobotApi.useDispatchApiRequests
>
const mockGetRequestById = RobotApi.getRequestById as jest.MockedFunction<
  typeof RobotApi.getRequestById
>
const render = (props: React.ComponentProps<typeof CheckPipettesButton>) => {
  return renderWithProviders(<CheckPipettesButton {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const MOCK_ACTUAL_PIPETTE = {
  ...mockPipetteInfo.pipetteSpecs,
  model: 'model',
  tipLength: {
    value: 20,
  },
} as PipetteModelSpecs

describe('CheckPipettesButton', () => {
  let props: React.ComponentProps<typeof CheckPipettesButton>
  let dispatchApiRequest: DispatchApiRequestType
  beforeEach(() => {
    props = {
      robotName: 'otie',
      children: <div>btn text</div>,
      onDone: jest.fn(),
    }
    dispatchApiRequest = jest.fn()
    mockGetRequestById.mockReturnValue(null)
    mockUseDispatchApiRequests.mockReturnValue([dispatchApiRequest, ['id']])
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the confirm attachment btn and clicking on it calls fetchPipettes', () => {
    props = {
      robotName: 'otie',
      onDone: jest.fn(),
    }
    const { getByLabelText, getByText } = render(props)
    const btn = getByLabelText('Confirm')
    getByText('Confirm attachment')
    fireEvent.click(btn)
    expect(dispatchApiRequest).toBeCalledWith(mockFetchPipettes('otie'))
  })

  it('renders the confirm detachment btn and clicking on it calls fetchPipettes', () => {
    props = {
      robotName: 'otie',
      onDone: jest.fn(),
      actualPipette: MOCK_ACTUAL_PIPETTE,
    }
    const { getByLabelText, getByText } = render(props)
    const btn = getByLabelText('Confirm')
    getByText('Confirm detachment')
    fireEvent.click(btn)
    expect(dispatchApiRequest).toBeCalledWith(mockFetchPipettes('otie'))
  })

  it('renders the confirm detachment btn and with children and clicking on it calls fetchPipettes', () => {
    props = {
      ...props,
      actualPipette: MOCK_ACTUAL_PIPETTE,
    }
    const { getByLabelText, getByText } = render(props)
    const btn = getByLabelText('Confirm')
    getByText('btn text')
    fireEvent.click(btn)
    expect(dispatchApiRequest).toBeCalledWith(mockFetchPipettes('otie'))
  })
})
