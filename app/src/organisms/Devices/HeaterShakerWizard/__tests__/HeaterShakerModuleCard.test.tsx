import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { HeaterShakerModuleCard } from '../HeaterShakerModuleCard'
import { HeaterShakerModuleData } from '../../../ModuleCard/HeaterShakerModuleData'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'

vi.mock('../../../ModuleCard/HeaterShakerModuleData')

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
    vi.mocked(HeaterShakerModuleData).mockReturnValue(
      <div>mock heater shaker module data</div>
    )
  })

  it('renders the correct info', () => {
    render(props)
    screen.getByText('usb-1')
    screen.getByText('Heater-Shaker Module GEN1')
    screen.getByText('mock heater shaker module data')
    screen.getByAltText('Heater-Shaker')
    screen.getByLabelText('heater-shaker')
  })
})
