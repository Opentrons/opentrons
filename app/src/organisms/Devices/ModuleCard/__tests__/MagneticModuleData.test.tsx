import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { StatusLabel } from '../../../../atoms/StatusLabel'
import { MagneticModuleData } from '../MagneticModuleData'
import { mockMagneticModule } from '../../../../redux/modules/__fixtures__'

jest.mock('../../../../atoms/StatusLabel')

const mockStatusLabel = StatusLabel as jest.MockedFunction<typeof StatusLabel>

const render = (props: React.ComponentProps<typeof MagneticModuleData>) => {
  return renderWithProviders(<MagneticModuleData {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('MagneticModuleData', () => {
  let props: React.ComponentProps<typeof MagneticModuleData>
  beforeEach(() => {
    props = {
      moduleHeight: mockMagneticModule.data.height,
      moduleModel: mockMagneticModule.model,
      moduleStatus: mockMagneticModule.status,
    }
    mockStatusLabel.mockReturnValue(<div>Mock StatusLabel</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a status', () => {
    const { getByText } = render(props)

    getByText('Mock StatusLabel')
  })

  it('renders magnet height data', () => {
    const { getByText } = render(props)

    getByText(`Height: ${props.moduleHeight}`)
  })
})
