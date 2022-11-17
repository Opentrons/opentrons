import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'
import * as RobotApi from '../../../redux/robot-api'
import { i18n } from '../../../i18n'
import { fetchPipettes } from '../../../redux/pipettes'
import {
  mockAttachedPipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { DispatchApiRequestType } from '../../../redux/robot-api'
import { FLOWS } from '../constants'
import { MountPipette } from '../MountPipette'
import type { AttachedPipette } from '../../../redux/pipettes/types'

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
const render = (props: React.ComponentProps<typeof MountPipette>) => {
  return renderWithProviders(<MountPipette {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockPipette: AttachedPipette = {
  ...mockAttachedPipette,
  modelSpecs: mockGen3P1000PipetteSpecs,
}
describe('MountPipette', () => {
  let props: React.ComponentProps<typeof MountPipette>
  let dispatchApiRequest: DispatchApiRequestType
  jest.useFakeTimers()
  beforeEach(() => {
    props = {
      robotName: 'otie',
      mount: LEFT,
      goBack: jest.fn(),
      proceed: jest.fn(),
      chainRunCommands: jest.fn(),
      runId: RUN_ID_1,
      attachedPipette: { left: mockPipette, right: null },
      flowType: FLOWS.ATTACH,
      errorMessage: null,
      setShowErrorMessage: jest.fn(),
      isRobotMoving: false,
    }
    dispatchApiRequest = jest.fn()
    mockGetRequestById.mockReturnValue(null)
    mockUseDispatchApiRequests.mockReturnValue([dispatchApiRequest, ['id']])
  })
  it('returns the correct information, buttons work as expected', () => {
    const { getByText, getByAltText, getByRole } = render(props)
    getByText('Connect and screw in pipette')
    getByText(
      'Hold onto the pipette so it does not fall. Attach the pipette to the robot by alinging the pins and ensuring a secure connection with the pins.'
    )
    getByText(
      'Hold the pipette in place and use the hex screwdriver to tighten the pipette screws. Then test that the pipette is securely attached by gently pulling it side to side.'
    )
    getByAltText('Screw pattern')

    const goBack = getByRole('button', { name: 'Go back' })
    fireEvent.click(goBack)
    expect(props.goBack).toHaveBeenCalled()
    const proceedBtn = getByRole('button', { name: 'Continue' })
    fireEvent.click(proceedBtn)
    expect(dispatchApiRequest).toBeCalledWith(mockFetchPipettes('otie'))
  })
})
