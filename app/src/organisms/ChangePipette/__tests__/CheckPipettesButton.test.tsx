import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import * as RobotApi from '../../../redux/robot-api'
import { useFeatureFlag } from '../../../redux/config'
import { fetchPipettes } from '../../../redux/pipettes'
import { CheckPipettesButton } from '../CheckPipettesButton'
import type { DispatchApiRequestType } from '../../../redux/robot-api'

jest.mock('../../../redux/robot-api')
jest.mock('../../../redux/pipettes')
jest.mock('../../../redux/config')

const mockFetchPipettes = fetchPipettes as jest.MockedFunction<
  typeof fetchPipettes
>
const mockUseDispatchApiRequests = RobotApi.useDispatchApiRequests as jest.MockedFunction<
  typeof RobotApi.useDispatchApiRequests
>
const mockFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>
const render = (props: React.ComponentProps<typeof CheckPipettesButton>) => {
  return renderWithProviders(<CheckPipettesButton {...props} />, {
    i18nInstance: i18n,
  })[0]
}
describe('CheckPipettesButton', () => {
  let props: React.ComponentProps<typeof CheckPipettesButton>
  let dispatchApiRequest: DispatchApiRequestType
  beforeEach(() => {
    props = {
      robotName: 'otie',
      children: <div>btn text</div>,
      hidden: false,
      onDone: jest.fn(),
    }
    dispatchApiRequest = jest.fn()
    mockFeatureFlag.mockReturnValue(false)
    mockUseDispatchApiRequests.mockReturnValue([dispatchApiRequest, ['id']])
  })
  it('renders the button without ff and clicking on it calls fetchPipettes', () => {
    const { getByRole } = render(props)
    const btn = getByRole('button', { name: 'btn text' })
    fireEvent.click(btn)
    expect(mockFetchPipettes).toHaveBeenCalled()
  })
  it('renders the button with ff and clicking on it calls fetchPipettes', () => {
    mockFeatureFlag.mockReturnValue(true)
    const { getByLabelText } = render(props)
    const btn = getByLabelText('Confirm')
    fireEvent.click(btn)
    expect(mockFetchPipettes).toHaveBeenCalled()
  })
})
