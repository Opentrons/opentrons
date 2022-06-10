import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../../i18n'
import * as RobotApi from '../../../../redux/robot-api'
import { ConfigurePipette } from '../../../ConfigurePipette'
import { PipetteSettingsSlideout } from '../PipetteSettingsSlideout'

import { mockLeftSpecs } from '../../../../redux/pipettes/__fixtures__'

import type { DispatchApiRequestType } from '../../../../redux/robot-api'

jest.mock('../../../ConfigurePipette')
jest.mock('../../../../redux/robot-api')

const mockConfigurePipette = ConfigurePipette as jest.MockedFunction<
  typeof ConfigurePipette
>
const mockUseDispatchApiRequest = RobotApi.useDispatchApiRequest as jest.MockedFunction<
  typeof RobotApi.useDispatchApiRequest
>
const mockGetRequestById = RobotApi.getRequestById as jest.MockedFunction<
  typeof RobotApi.getRequestById
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
    dispatchApiRequest = jest.fn()
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, ['id']])
    mockConfigurePipette.mockReturnValue(<div>mock configure pipette</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders correct text', () => {
    const { getByText, getByRole } = render(props)

    getByText('Left Pipette Settings')
    getByText('mock configure pipette')
    const button = getByRole('button', { name: /exit/i })
    fireEvent.click(button)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
