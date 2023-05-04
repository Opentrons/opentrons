import { i18n } from '../../../../i18n'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'
import { HeaterShakerModuleData } from '../../../ModuleCard/HeaterShakerModuleData'
import { HeaterShakerModuleCard } from '../HeaterShakerModuleCard'
import { renderWithProviders } from '@opentrons/components'
import * as React from 'react'

jest.mock('../../../ModuleCard/HeaterShakerModuleData')

const mockHeaterShakerModuleData = HeaterShakerModuleData as jest.MockedFunction<
  typeof HeaterShakerModuleData
>

const render = (props: React.ComponentProps<typeof HeaterShakerModuleCard>) => {
  return renderWithProviders(<HeaterShakerModuleCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HeaterShakerModuleCard', () => {
  let props: React.ComponentProps<typeof HeaterShakerModuleCard>
  beforeEach(() => {
    props = {
      module: mockHeaterShaker,
    }
    mockHeaterShakerModuleData.mockReturnValue(
      <div>mock heater shaker module data</div>
    )
  })

  it('renders the correct info', () => {
    const { getByText, getByAltText, getByLabelText } = render(props)
    getByText('usb-1')
    getByText('Heater-Shaker Module GEN1')
    getByText('mock heater shaker module data')
    getByAltText('Heater-Shaker')
    getByLabelText('heater-shaker')
  })
})
