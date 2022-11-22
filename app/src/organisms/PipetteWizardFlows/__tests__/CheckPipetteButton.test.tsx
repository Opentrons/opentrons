import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import * as RobotApi from '../../../redux/robot-api'
import { fetchPipettes } from '../../../redux/pipettes'
import { CheckPipetteButton } from '../CheckPipetteButton'

import { DispatchApiRequestType } from '../../../redux/robot-api'

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
const render = (props: React.ComponentProps<typeof CheckPipetteButton>) => {
  return renderWithProviders(<CheckPipetteButton {...props} />)[0]
}

describe('CheckPipetteButton', () => {
  let props: React.ComponentProps<typeof CheckPipetteButton>
  let dispatchApiRequest: DispatchApiRequestType
  beforeEach(() => {
    props = {
      robotName: 'otie',
      proceed: jest.fn(),
      proceedButtonText: 'continue',
    }
    dispatchApiRequest = jest.fn()
    mockGetRequestById.mockReturnValue(null)
    mockUseDispatchApiRequests.mockReturnValue([dispatchApiRequest, ['id']])
  })
  it('clicking on the button dispatches api request', () => {
    const { getByRole } = render(props)
    const proceedBtn = getByRole('button', { name: 'continue' })
    fireEvent.click(proceedBtn)
    expect(dispatchApiRequest).toBeCalledWith(mockFetchPipettes('otie'))
  })
})
