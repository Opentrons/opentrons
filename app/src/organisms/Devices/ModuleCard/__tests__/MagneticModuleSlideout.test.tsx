import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { useSendModuleCommand } from '../../../../redux/modules'
import { InputField } from '../../../../atoms/InputField'
import { MagneticModuleSlideout } from '../MagneticModuleSlideout'

import {
  mockMagneticModule,
  mockMagneticModuleGen2,
} from '../../../../redux/modules/__fixtures__'

jest.mock('../../../../redux/modules')
jest.mock('../../../../atoms/InputField')

const mockUseSendModuleCommand = useSendModuleCommand as jest.MockedFunction<
  typeof useSendModuleCommand
>
const mockInputField = InputField as jest.MockedFunction<typeof InputField>

const render = (props: React.ComponentProps<typeof MagneticModuleSlideout>) => {
  return renderWithProviders(<MagneticModuleSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('MagneticModuleSlideout', () => {
  let props: React.ComponentProps<typeof MagneticModuleSlideout>
  beforeEach(() => {
    props = {
      module: mockMagneticModule,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    mockInputField.mockReturnValue(<div></div>)
    mockUseSendModuleCommand.mockReturnValue(jest.fn())
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and body for a gen1 magnetic module', () => {
    const { getByText } = render(props)

    getByText('Set Engage Height for Magnetic Module GEN1')
    getByText(
      'Set the engage height for this Magnetic Module. Enter an integer between -5 and 40.'
    )
    getByText('GEN 1 Height Ranges')
    getByText('Max Engage Height')
    getByText('Labware Bottom')
    getByText('Disengaged')
    getByText('40')
    getByText('0')
    getByText('-5')
    getByText('Engage height')
    getByText('Set Engage Height')
  })

  it('renders correct title and body for a gen2 magnetic module', () => {
    props = {
      module: mockMagneticModuleGen2,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByText } = render(props)

    getByText('Set Engage Height for Magnetic Module GEN2')
    getByText(
      'Set the engage height for this Magnetic Module. Enter an integer between -4 and 16.'
    )
    getByText('GEN 2 Height Ranges')
    getByText('Max Engage Height')
    getByText('Labware Bottom')
    getByText('Disengaged')
    getByText('16 mm')
    getByText('0 mm')
    getByText('-4 mm')
    getByText('Engage height')
    getByText('Set Engage Height')
  })

  it('renders the button and it is not clickable until there is something in form field', () => {
    const { getByRole } = render(props)
    const button = getByRole('button', { name: 'Set Engage Height' })
    expect(button).not.toBeEnabled()
  })
})
