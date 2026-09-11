import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { getConfig } from '/app/redux/config'
import * as RobotApi from '/app/redux/robot-api'
import { mockPipetteSettingsFieldsMap } from '/app/resources/instruments/__fixtures__'

import { ConfigurePipette } from '../../ConfigurePipette'

import type { ComponentProps } from 'react'
import type { DispatchApiRequestType } from '/app/redux/robot-api'
import type { State } from '/app/redux/types'

vi.mock('/app/redux/robot-api')
vi.mock('/app/redux/config')

const render = (props: ComponentProps<typeof ConfigurePipette>) => {
  return renderWithProviders(<ConfigurePipette {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockRobotName = 'mockRobotName'

describe('ConfigurePipette', () => {
  let dispatchApiRequest: DispatchApiRequestType
  let props: ComponentProps<typeof ConfigurePipette>

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
    render(props)

    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBe(13)
  })
})
