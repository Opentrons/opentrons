import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { waitFor } from '@testing-library/dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import * as RobotApi from '../../../../redux/robot-api'
import {
  getAttachedPipetteSettingsFieldsById,
  updatePipetteSettings,
} from '../../../../redux/pipettes'
import { getConfig } from '../../../../redux/config'
import { PipetteSettingsSlideout } from '../PipetteSettingsSlideout'

import {
  mockLeftSpecs,
  mockPipetteSettingsFieldsMap,
} from '../../../../redux/pipettes/__fixtures__'

import type { DispatchApiRequestType } from '../../../../redux/robot-api'
import type { UpdatePipetteSettingsAction } from '../../../../redux/pipettes/types'

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
const mockGetAttachedPipetteSettingsFieldsById = getAttachedPipetteSettingsFieldsById as jest.MockedFunction<
  typeof getAttachedPipetteSettingsFieldsById
>
const mockUpdatePipetteSettings = updatePipetteSettings as jest.MockedFunction<
  typeof updatePipetteSettings
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
    mockGetAttachedPipetteSettingsFieldsById.mockReturnValue(
      mockPipetteSettingsFieldsMap
    )
    dispatchApiRequest = jest.fn()
    when(mockUseDispatchApiRequest)
      .calledWith()
      .mockReturnValue([dispatchApiRequest, ['id']])
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders correct heading and number of text boxes', () => {
    const { getByRole, getAllByRole } = render(props)

    getByRole('heading', { name: 'Left Pipette Settings' })
    const inputs = getAllByRole('textbox')
    expect(inputs.length).toBe(9)
  })

  it('renders close button that calls props.onCloseClick when clicked', () => {
    const { getByRole } = render(props)

    const button = getByRole('button', { name: /exit/i })
    fireEvent.click(button)
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  it('renders confirm button and calls dispatchApiRequest with updatePipetteSettings action object when clicked', async () => {
    const { getByRole } = render(props)
    const button = getByRole('button', { name: 'Confirm' })

    when(mockUpdatePipetteSettings)
      .calledWith(mockRobotName, props.pipetteId, expect.any(Object))
      .mockReturnValue({
        type: 'pipettes:UPDATE_PIPETTE_SETTINGS',
      } as UpdatePipetteSettingsAction)

    fireEvent.click(button)

    await waitFor(() => {
      expect(dispatchApiRequest).toHaveBeenCalledWith({
        type: 'pipettes:UPDATE_PIPETTE_SETTINGS',
      })
    })
  })
})
