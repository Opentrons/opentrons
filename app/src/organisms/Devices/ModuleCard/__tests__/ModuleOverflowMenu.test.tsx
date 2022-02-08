import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../../i18n'
import {
  mockMagneticModule,
  mockTemperatureModuleGen2,
  mockThermocycler,
} from '../../../../redux/modules/__fixtures__'
import { ModuleOverflowMenu } from '../ModuleOverflowMenu'
import { MagneticModuleSlideout } from '../MagneticModuleSlideout'

jest.mock('../MagneticModuleSlideout')

const mockMagneticModuleSlideout = MagneticModuleSlideout as jest.MockedFunction<
  typeof MagneticModuleSlideout
>

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
    }
    mockMagneticModuleSlideout.mockReturnValue(
      <div>Mock mag module slideout</div>
    )
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
    getByText('Mock mag module slideout')
    const buttonAbout = getByRole('button', { name: 'About module' })
    fireEvent.click(buttonAbout)
    expect(buttonAbout).toBeEnabled()
    expect(getByText('About module')).toHaveStyle('color: #16212D')
  })
  //  todo imemdiately: add on to following 2 tests when their slideout component is made
  it('renders the correct temperature module menu', () => {
    props = {
      module: mockTemperatureModuleGen2,
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
    }
    const { getByRole } = render(props)
    const buttonSetting1 = getByRole('button', { name: 'Set lid temperature' })
    fireEvent.click(buttonSetting1)
    const buttonAbout = getByRole('button', { name: 'About module' })
    fireEvent.click(buttonAbout)
    const buttonSetting2 = getByRole('button', {
      name: 'Set block temperature',
    })
    fireEvent.click(buttonSetting2)
    expect(buttonAbout).toBeEnabled()
    expect(buttonSetting1).toBeEnabled()
    expect(buttonSetting2).toBeEnabled()
  })
})
