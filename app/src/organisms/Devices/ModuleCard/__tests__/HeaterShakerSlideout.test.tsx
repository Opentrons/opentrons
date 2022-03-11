import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../../i18n'
import { InputField } from '@opentrons/components/src/forms/InputField'
import { HeaterShakerSlideout } from '../HeaterShakerSlideout'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'

jest.mock('@opentrons/react-api-client')
jest.mock('@opentrons/components/src/forms/InputField')

const mocUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockInputField = InputField as jest.MockedFunction<typeof InputField>

const render = (props: React.ComponentProps<typeof HeaterShakerSlideout>) => {
  return renderWithProviders(<HeaterShakerSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

let mockCreateCommand: jest.Mock

describe('HeaterShakerSlideout', () => {
  let props: React.ComponentProps<typeof HeaterShakerSlideout>
  beforeEach(() => {
    mockInputField.mockReturnValue(<div></div>)
    mocUseLiveCommandMutation.mockReturnValue({
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
    mockInputField.mockReturnValue(<div>300 RPM</div>)
    mocUseLiveCommandMutation.mockReturnValue({
      commandType: 'heaterShakerModule/setTargetShakeSpeed',
      params: {
        //  TODO replace serial with id
        moduleId: props.module.serial,
        rpm: 300,
      },
    } as any)
    fireEvent.click(button)
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
    mocUseLiveCommandMutation.mockReturnValue({
      commandType: 'heaterShakerModule/awaitTemperature',
      //  TODO replace serial with id
      params: { moduleId: props.module.serial },
    } as any)
    fireEvent.click(button)
    expect(button).not.toBeEnabled()
  })
})
