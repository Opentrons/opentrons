import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../../i18n'
import { getIsHeaterShakerAttached } from '../../../../redux/config'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'
import { HeaterShakerSlideout } from '../HeaterShakerSlideout'
import { ConfirmAttachmentModal } from '../ConfirmAttachmentModal'

jest.mock('@opentrons/react-api-client')
jest.mock('../ConfirmAttachmentModal')
jest.mock('../../../../redux/config')

const mockGetIsHeaterShakerAttached = getIsHeaterShakerAttached as jest.MockedFunction<
  typeof getIsHeaterShakerAttached
>
const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockConfirmAttachmentModal = ConfirmAttachmentModal as jest.MockedFunction<
  typeof ConfirmAttachmentModal
>

const render = (props: React.ComponentProps<typeof HeaterShakerSlideout>) => {
  return renderWithProviders(<HeaterShakerSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HeaterShakerSlideout', () => {
  let props: React.ComponentProps<typeof HeaterShakerSlideout>
  let mockCreateLiveCommand = jest.fn()

  beforeEach(() => {
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    mockGetIsHeaterShakerAttached.mockReturnValue(false)
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
    mockConfirmAttachmentModal.mockReturnValue(
      <div>mock confirm attachment modal</div>
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and body for Heater shaker set shake', () => {
    props = {
      module: mockHeaterShaker,
      isSetShake: true,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByText } = render(props)

    getByText('Set Shake Speed for Heater Shaker Module GEN1')
    getByText('Set RPM for this module.')
    getByText('Set shake speed')
  })

  it('renders correct title and body for heater shaker set temperature', () => {
    props = {
      module: mockHeaterShaker,
      isSetShake: false,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByText } = render(props)

    getByText('Set Temperature for Heater Shaker Module GEN1')
    getByText(
      'Set target temperature. This module actively heats but cools passively to room temperature.'
    )
    getByText('Set temperature')
  })

  it('renders the button and it is not clickable until there is something in form field for set shake', () => {
    props = {
      module: mockHeaterShaker,
      isSetShake: true,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }

    const { getByRole, getByTestId, getByText } = render(props)
    const button = getByRole('button', { name: 'Set Shake Speed' })
    const input = getByTestId('heaterShakerModuleV1_true')
    fireEvent.change(input, { target: { value: '300' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    getByText('mock confirm attachment modal')
  })

  it('renders the button and it is not clickable until there is something in form field for set temp', () => {
    props = {
      module: mockHeaterShaker,
      isSetShake: false,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Set Temperature' })
    const input = getByTestId('heaterShakerModuleV1_false')
    fireEvent.change(input, { target: { value: '20' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/setTargetTemperature',
        params: {
          moduleId: 'heatershaker_id',
          celsius: 20,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })
  it('renders heater shaker form field and when button is clicked, confirm attachment modal is not rendered', () => {
    mockGetIsHeaterShakerAttached.mockReturnValue(true)
    props = {
      module: mockHeaterShaker,
      isSetShake: true,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }

    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Set Shake Speed' })
    const input = getByTestId('heaterShakerModuleV1_true')
    fireEvent.change(input, { target: { value: '300' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
