import * as React from 'react'
import { COLORS, renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../../i18n'
import {
  mockMagneticModule,
  mockTemperatureModuleGen2,
  mockThermocycler,
} from '../../../../redux/modules/__fixtures__'
import { ModuleOverflowMenu } from '../ModuleOverflowMenu'

const render = (props: React.ComponentProps<typeof ModuleOverflowMenu>) => {
  return renderWithProviders(<ModuleOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ModuleOverflowMenu', () => {
  let props: React.ComponentProps<typeof ModuleOverflowMenu>
  beforeEach(() => {
    props = {
      module: mockMagneticModule,
      handleClick: jest.fn(),
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the correct magnetic module menu', () => {
    const { getByRole, getByText } = render(props)
    const buttonSetting = getByRole('button', { name: 'Set engage height' })
    expect(buttonSetting).toBeEnabled()
    expect(buttonSetting).toHaveStyle(`
      background-color: transparent;
    `)
    fireEvent.click(buttonSetting)
    const buttonAbout = getByRole('button', { name: 'About module' })
    fireEvent.click(buttonAbout)
    expect(buttonAbout).toBeEnabled()
    expect(getByText('About module')).toHaveStyle('color: #16212D')
  })
  it('renders hover state color correctly', () => {
    const { getByRole } = render(props)
    const buttonSetting = getByRole('button', { name: 'Set engage height' })
    expect(buttonSetting).toHaveStyleRule(
      'background-color',
      COLORS.lightBlue,
      {
        modifier: ':hover',
      }
    )
  })
  //  todo imemdiately: add on to following 2 tests when their slideout component is made
  it('renders the correct temperature module menu', () => {
    props = {
      module: mockTemperatureModuleGen2,
      handleClick: jest.fn(),
    }
    const { getByRole } = render(props)
    const buttonSetting = getByRole('button', {
      name: 'Set module temperature',
    })
    fireEvent.click(buttonSetting)
    const buttonAbout = getByRole('button', { name: 'About module' })
    fireEvent.click(buttonAbout)
    expect(buttonAbout).toBeEnabled()
    expect(buttonSetting).toBeEnabled()
  })
  it('renders the correct TC module menu', () => {
    props = {
      module: mockThermocycler,
      handleClick: jest.fn(),
    }
    const { getByRole } = render(props)
    const buttonSettingLid = getByRole('button', {
      name: 'Set lid temperature',
    })
    fireEvent.click(buttonSettingLid)
    const buttonAbout = getByRole('button', { name: 'About module' })
    fireEvent.click(buttonAbout)
    const buttonSettingBlock = getByRole('button', {
      name: 'Set block temperature',
    })
    fireEvent.click(buttonSettingBlock)
    expect(buttonAbout).toBeEnabled()
    expect(buttonSettingLid).toBeEnabled()
    expect(buttonSettingBlock).toBeEnabled()
  })
})
