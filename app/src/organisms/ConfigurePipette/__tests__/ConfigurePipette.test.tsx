import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import * as RobotApi from '../../../redux/robot-api'
import { ConfigurePipette } from '../../ConfigurePipette'
import { mockPipetteSettingsFieldsMap } from '../../../redux/pipettes/__fixtures__'
import { getAttachedPipetteSettingsFieldsById } from '../../../redux/pipettes'
import { getConfig } from '../../../redux/config'

import type { DispatchApiRequestType } from '../../../redux/robot-api'

jest.mock('../../../redux/robot-api')
jest.mock('../../../redux/config')
jest.mock('../../../redux/pipettes')

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
const mockUseDispatchApiRequest = RobotApi.useDispatchApiRequest as jest.MockedFunction<
  typeof RobotApi.useDispatchApiRequest
>
const mockGetRequestById = RobotApi.getRequestById as jest.MockedFunction<
  typeof RobotApi.getRequestById
>
const mockGetAttachedPipetteSettingsFieldById = getAttachedPipetteSettingsFieldsById as jest.MockedFunction<
  typeof getAttachedPipetteSettingsFieldsById
>

const render = (props: React.ComponentProps<typeof ConfigurePipette>) => {
  return renderWithProviders(<ConfigurePipette {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockRobotName = 'mockRobotName'

describe('ConfigurePipette', () => {
  let dispatchApiRequest: DispatchApiRequestType

  let props: React.ComponentProps<typeof ConfigurePipette>

  beforeEach(() => {
    props = {
      pipetteId: 'id',
      robotName: mockRobotName,
      updateRequest: { status: 'pending' },
      updateSettings: jest.fn(),
      closeModal: jest.fn(),
    }
    mockGetRequestById.mockReturnValue({
      status: RobotApi.SUCCESS,
      response: {
        method: 'POST',
        ok: true,
        path: '/',
        status: 200,
      },
    })
    mockGetConfig.mockReturnValue({} as any)
    mockGetAttachedPipetteSettingsFieldById.mockReturnValue(
      mockPipetteSettingsFieldsMap
    )
    dispatchApiRequest = jest.fn()
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, ['id']])
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders correct text', () => {
    const { getByText } = render(props)

    getByText('Bottom')
    getByText('Top')
  })

  it('renders reset button', () => {
    const { getByText } = render(props)
    getByText('Reset all')
  })
})
