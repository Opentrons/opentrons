import * as React from 'react'
import { i18n } from '../../../../i18n'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { InputField } from '@opentrons/components/src/forms/InputField'
import {
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
} from '@opentrons/shared-data'
import { useSendModuleCommand } from '../../../../redux/modules'
import { TemperatureModuleSlideout } from '../TemperatureModuleSlideout'

jest.mock('../../../../redux/modules')
jest.mock('@opentrons/components/src/forms/InputField')

const mockUseSendModuleCommand = useSendModuleCommand as jest.MockedFunction<
  typeof useSendModuleCommand
>
const mockInputField = InputField as jest.MockedFunction<typeof InputField>

const render = (
  props: React.ComponentProps<typeof TemperatureModuleSlideout>
) => {
  return renderWithProviders(<TemperatureModuleSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const SERIAL = 'SERIAL'
describe('TemperatureModuleSlideout', () => {
  let props: React.ComponentProps<typeof TemperatureModuleSlideout>
  beforeEach(() => {
    props = {
      model: TEMPERATURE_MODULE_V1,
      isExpanded: true,
      serial: SERIAL,
    }
    mockInputField.mockReturnValue(<div></div>)
    mockUseSendModuleCommand.mockReturnValue(jest.fn())
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and body for a gen1 temperature module', () => {
    const { getByText } = render(props)

    getByText('Set Temperature for Temperature Module GEN1')
    getByText(
      'Pre heat or cool your Temperature Module GEN1. Enter a whole number between 4 °C and 96 °C.'
    )
    getByText('Temperature')
  })

  it('renders correct title and body for a gen2 temperature module', () => {
    props = {
      model: TEMPERATURE_MODULE_V2,
      serial: SERIAL,
      isExpanded: true,
    }
    const { getByText } = render(props)

    getByText('Set Temperature for Temperature Module GEN2')
    getByText(
      'Pre heat or cool your Temperature Module GEN2. Enter a whole number between 4 °C and 96 °C.'
    )
    getByText('Temperature')
  })

  it('renders the button and it is not clickable until there is something in form field', () => {
    const { getByRole } = render(props)
    const button = getByRole('button', { name: 'Set Temperature' })
    expect(button).not.toBeEnabled()
    mockInputField.mockReturnValue(<div>6 C</div>)
    mockUseSendModuleCommand.mockReturnValue({
      moduleId: SERIAL,
      command: 'set_temperature',
      args: 6,
    } as any)
    fireEvent.click(button)
    expect(button).not.toBeEnabled()
  })
})
