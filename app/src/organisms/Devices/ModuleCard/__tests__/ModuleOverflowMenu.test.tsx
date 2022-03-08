import * as React from 'react'
import { COLORS, renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../../i18n'
import {
  mockMagneticModule,
  mockTemperatureModuleGen2,
  mockThermocycler,
  mockHeaterShaker,
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
      handleAboutClick: jest.fn(),
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
    expect(props.handleClick).toHaveBeenCalled()
    const buttonAbout = getByRole('button', { name: 'About module' })
    fireEvent.click(buttonAbout)
    expect(props.handleAboutClick).toHaveBeenCalled()
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
  it('renders the correct temperature module menu', () => {
    props = {
      module: mockTemperatureModuleGen2,
      handleClick: jest.fn(),
      handleAboutClick: jest.fn(),
    }
    const { getByRole } = render(props)
    const buttonSetting = getByRole('button', {
      name: 'Set module temperature',
    })
    fireEvent.click(buttonSetting)
    expect(props.handleClick).toHaveBeenCalled()
    const buttonAbout = getByRole('button', { name: 'About module' })
    fireEvent.click(buttonAbout)
    expect(props.handleAboutClick).toHaveBeenCalled()
  })
  it('renders the correct TC module menu', () => {
    props = {
      module: mockThermocycler,
      handleClick: jest.fn(),
      handleAboutClick: jest.fn(),
    }
    const { getByRole } = render(props)
    const buttonSettingLid = getByRole('button', {
      name: 'Set lid temperature',
    })
    fireEvent.click(buttonSettingLid)
    expect(props.handleClick).toHaveBeenCalled()
    const buttonAbout = getByRole('button', { name: 'About module' })
    fireEvent.click(buttonAbout)
    expect(props.handleAboutClick).toHaveBeenCalled()
    const buttonSettingBlock = getByRole('button', {
      name: 'Set block temperature',
    })
    fireEvent.click(buttonSettingBlock)
    expect(props.handleClick).toHaveBeenCalled()
  })
  it('renders the correct Heater Shaker module menu', () => {
    props = {
      module: mockHeaterShaker,
      handleClick: jest.fn(),
      handleAboutClick: jest.fn(),
    }
    // TODO(sh, 2022-03-08): extend tests when menu component is wired up
    const { getByRole } = render(props)
    getByRole('button', {
      name: 'Set temperature',
    })
    getByRole('button', {
      name: 'Set shake speed',
    })
    getByRole('button', {
      name: 'Open Labware Latch',
    })
    getByRole('button', { name: 'About module' })
    getByRole('button', { name: 'See how to attach to deck' })
    getByRole('button', { name: 'Test shake' })
  })
})
