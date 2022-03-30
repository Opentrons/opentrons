import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import * as CustomLabware from '../../../redux/custom-labware'
import * as Config from '../../../redux/config'

import { AdvancedSettings } from '../AdvancedSettings'

jest.mock('../../../redux/config')
jest.mock('../../../redux/calibration')
jest.mock('../../../redux/custom-labware')
jest.mock('../../../redux/discovery')

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <AdvancedSettings />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const getCustomLabwarePath = CustomLabware.getCustomLabwareDirectory as jest.MockedFunction<
  typeof CustomLabware.getCustomLabwareDirectory
>
const getChannelOptions = Config.getUpdateChannelOptions as jest.MockedFunction<
  typeof Config.getUpdateChannelOptions
>

describe('AdvancedSettings', () => {
  beforeEach(() => {
    getCustomLabwarePath.mockReturnValue('')
    getChannelOptions.mockReturnValue([
      {
        name: 'Stable',
        value: 'latest',
      },
      { name: 'Beta', value: 'beta' },
      { name: 'Alpha', value: 'alpha' },
    ])
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct titles', () => {
    const [{ getByText }] = render()
    getByText('Update channel')
    getByText('Additional Custom Labware Source Folder')
    getByText('Tip Length Calibration Method')
    getByText('Display Unavailable Robots')
    getByText('Clear Unavailable Robots')
    getByText('Enable Developer Tools')
  })
  it('renders the update channel section', () => {
    const [{ getByText, getByRole }] = render()
    getByText(
      'Stable receives the latest stable releases. Beta allows you to try out new in-progress features before they launch in Stable channel, but they have not completed testing yet.'
    )
    getByRole('option', { name: 'Stable' })
    getByRole('option', { name: 'Beta' })
    getByRole('option', { name: 'Alpha' })
  })
  it('renders the custom labware section with source folder selected', () => {
    getCustomLabwarePath.mockReturnValue('/mock/custom-labware-path')
    const [{ getByText, getByRole }] = render()
    getByText(
      'If you want to specify a folder to manually manage Opentrons Custom Labware files, you can add the directory here.'
    )
    getByText('Additional Source Folder')
    getByRole('button', { name: 'Change labware source folder' })
  })
  it('renders the custom labware section with no source folder selected', () => {
    const [{ getByText, getByRole }] = render()
    getByText('No additional source folder specified')
    getByRole('button', { name: 'Add labware source folder' })
  })
  it('renders the tip length cal section', () => {
    const [{ getByRole }] = render()
    getByRole('radio', { name: 'Always use calibration block to calibrate' })
    getByRole('radio', { name: 'Always use trash bin to calibrate' })
    getByRole('radio', {
      name: 'Always show the prompt to choose calibration block or trash bin',
    })
  })
  it('renders the display unavailable robots section', () => {
    const [{ getByText, getByRole }] = render()
    getByText(
      'Disabling this may improve overall networking performance in environments with many robots, but it may be slower to find robots when opening the app.'
    )
    getByRole('switch', { name: 'display_unavailable_robots' })
  })

  it('renders the clear unavailable robots section', () => {
    const [{ getByText, getByRole }] = render()
    getByText(
      'Clear the list of unavailable robots on the Devices page. This action cannot be undone.'
    )
    getByRole('button', {
      name: 'Clear unavailable robots list',
    })
  })
  it('renders the developer tools section', () => {
    const [{ getByText, getByRole }] = render()
    getByText(
      'Enabling this setting opens Developer Tools on app launch, enables additional logging and gives access to feature flags.'
    )
    getByRole('switch', { name: 'enable_dev_tools' })
  })
})
