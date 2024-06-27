import * as React from 'react'
import { when } from 'vitest-when'
import { vi, it, expect, describe, beforeEach } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import * as RobotApi from '../../../redux/robot-api'
import { ConfigurePipette } from '../../ConfigurePipette'
import { mockPipetteSettingsFieldsMap } from '../../../redux/pipettes/__fixtures__'
import { getConfig } from '../../../redux/config'

import type { DispatchApiRequestType } from '../../../redux/robot-api'
import type { State } from '../../../redux/types'

vi.mock('../../../redux/robot-api')
vi.mock('../../../redux/config')

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
      isUpdateLoading: false,
      updateError: null,
      settings: mockPipetteSettingsFieldsMap,
      robotName: mockRobotName,
      updateSettings: vi.fn(),
      closeModal: vi.fn(),
      formId: 'id',
    }
    when(vi.mocked(RobotApi.getRequestById))
      .calledWith({} as State, 'id')
      .thenReturn({
        status: RobotApi.SUCCESS,
        response: {
          method: 'POST',
          ok: true,
          path: '/',
          status: 200,
        },
      })
    vi.mocked(getConfig).mockReturnValue({} as any)
    dispatchApiRequest = vi.fn()
    when(vi.mocked(RobotApi.useDispatchApiRequest))
      .calledWith()
      .thenReturn([dispatchApiRequest, ['id']])
  })

  it('renders correct number of text boxes given the pipette settings data supplied by getAttachedPipetteSettingsFieldsById', () => {
    const { getAllByRole } = render(props)

    const inputs = getAllByRole('textbox')
    expect(inputs.length).toBe(13)
  })
})
