import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { waitFor } from '@testing-library/dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import {
  useHost,
  useUpdatePipetteSettingsMutation,
} from '@opentrons/react-api-client'
import { i18n } from '../../../../i18n'
import { PipetteSettingsSlideout } from '../PipetteSettingsSlideout'

import {
  mockLeftSpecs,
  mockPipetteSettingsFieldsMap,
} from '../../../../redux/pipettes/__fixtures__'

jest.mock('@opentrons/react-api-client')

const mockUseHost = useHost as jest.MockedFunction<typeof useHost>
const mockUseUpdatePipetteSettingsMutation = useUpdatePipetteSettingsMutation as jest.MockedFunction<
  typeof useUpdatePipetteSettingsMutation
>

const render = (
  props: React.ComponentProps<typeof PipetteSettingsSlideout>
) => {
  return renderWithProviders(<PipetteSettingsSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockRobotName = 'mockRobotName'

describe('PipetteSettingsSlideout', () => {
  let props: React.ComponentProps<typeof PipetteSettingsSlideout>
  let mockUpdatePipetteSettings: jest.Mock

  beforeEach(() => {
    props = {
      pipetteId: 'id',
      settings: mockPipetteSettingsFieldsMap,
      robotName: mockRobotName,
      pipetteName: mockLeftSpecs.displayName,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    when(mockUseHost)
      .calledWith()
      .mockReturnValue({} as any)

    mockUpdatePipetteSettings = jest.fn()

    when(mockUseUpdatePipetteSettingsMutation)
      .calledWith(props.pipetteId, expect.anything())
      .mockReturnValue({
        updatePipetteSettings: mockUpdatePipetteSettings,
        isLoading: false,
        error: null,
      } as any)
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders correct heading and number of text boxes', () => {
    const { getByRole, getAllByRole } = render(props)

    getByRole('heading', { name: 'Left Pipette Settings' })
    const inputs = getAllByRole('textbox')
    expect(inputs.length).toBe(13)
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

    fireEvent.click(button)
    await waitFor(() => {
      expect(mockUpdatePipetteSettings).toHaveBeenCalledWith({
        fields: expect.objectContaining({
          blowout: { value: 2 },
          bottom: { value: 3 },
          dropTip: { value: 1 },
          dropTipCurrent: null,
          dropTipSpeed: null,
          pickUpCurrent: null,
          pickUpDistance: null,
          plungerCurrent: null,
          top: { value: 4 },
        }),
      })
    })
  })
})
