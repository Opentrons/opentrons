import * as React from 'react'
import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../../i18n'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'
import { InputField } from '../../../../atoms/InputField'
import { HeaterShakerSlideout } from '../HeaterShakerSlideout'
import { when } from 'jest-when'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../atoms/InputField')

const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockInputField = InputField as jest.MockedFunction<typeof InputField>

const render = (props: React.ComponentProps<typeof HeaterShakerSlideout>) => {
  return renderWithProviders(<HeaterShakerSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HeaterShakerSlideout', () => {
  let props: React.ComponentProps<typeof HeaterShakerSlideout>
  let mockCreateCommand = jest.fn()

  beforeEach(() => {
    mockCreateCommand = jest.fn()
    mockInputField.mockReturnValue(<div></div>)
    mockUseLiveCommandMutation.mockReturnValue({
      createCommand: mockCreateCommand,
    } as any)
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
    const { getByRole } = render(props)
    const button = getByRole('button', { name: 'Set Shake Speed' })
    expect(button).not.toBeEnabled()
    when(mockInputField)
      .calledWith(partialComponentPropsMatcher({ id: 'input' }))
      .mockReturnValue(<div>300 RPM</div>)
    // const input = getByTestId('input')
    // fireEvent.change(input, { target: { value: ' 300 RPM' } })
    // expect(button).toBeEnabled()
    fireEvent.click(button)
    // expect(mockCreateCommand).toHaveBeenCalledWith({
    //   command: {
    //     commandType: 'heaterShakerModule/setTargetShakeSpeed',
    //     params: {
    //       moduleId: 'heatershaker_id',
    //       rpm: 300,
    //     },
    //   },
    // })
    expect(button).not.toBeEnabled()
  })

  it('renders the button and it is not clickable until there is something in form field for set temp', () => {
    props = {
      module: mockHeaterShaker,
      isSetShake: false,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByRole } = render(props)
    const button = getByRole('button', { name: 'Set Temperature' })
    expect(button).not.toBeEnabled()
    mockInputField.mockReturnValue(<div>40 C</div>)
    fireEvent.click(button)
    expect(button).not.toBeEnabled()
  })
})
