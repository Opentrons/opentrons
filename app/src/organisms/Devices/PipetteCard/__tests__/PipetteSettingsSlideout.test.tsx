import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { act } from 'react-dom/test-utils'
import { i18n } from '../../../../i18n'
import * as RobotApi from '../../../../redux/robot-api'
import { getAttachedPipetteSettingsFieldsById } from '../../../../redux/pipettes'
import { getConfig } from '../../../../redux/config'
import { PipetteSettingsSlideout } from '../PipetteSettingsSlideout'

import {
  mockLeftSpecs,
  mockPipetteSettingsFieldsMap,
} from '../../../../redux/pipettes/__fixtures__'

import type { DispatchApiRequestType } from '../../../../redux/robot-api'

jest.mock('../../../../redux/robot-api')
jest.mock('../../../../redux/config')
jest.mock('../../../../redux/pipettes')

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

const render = (
  props: React.ComponentProps<typeof PipetteSettingsSlideout>
) => {
  return renderWithProviders(<PipetteSettingsSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockRobotName = 'mock robotName'

describe('PipetteSettingsSlideout', () => {
  let dispatchApiRequest: DispatchApiRequestType

  let props: React.ComponentProps<typeof PipetteSettingsSlideout>

  beforeEach(() => {
    props = {
      pipetteId: 'id',
      robotName: mockRobotName,
      pipetteName: mockLeftSpecs.displayName,
      isExpanded: true,
      onCloseClick: jest.fn(),
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
    // mockConfigurePipette.mockReturnValue(<div>mock configure pipette</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders correct text', () => {
    const { getByText, getByRole } = render(props)

    getByText('Left Pipette Settings')
    getByText('Bottom')
    const button = getByRole('button', { name: /exit/i })
    act(() => button.click())
    expect(props.onCloseClick).toHaveBeenCalled()
  })
  it('renders confirm button and calls form onsubmit when clicked', () => {
    const { getByText, getByRole, getByTestId } = render(props)

    getByText('Bottom')
    const form = getByTestId('ConfigForm_form')
    form.onsubmit = jest.fn()
    const button = getByRole('button', { name: 'Confirm' })
    act(() => button.click())
    expect(form.onsubmit).toHaveBeenCalled()
  })
})
