import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { mockMagneticModule } from '../../../redux/modules/__fixtures__'
import { useAttachedModules, useIsRobotViewable } from '../hooks'
import { ModuleCard } from '../ModuleCard'
import { PipettesAndModules } from '../PipettesAndModules'

jest.mock('../hooks')
jest.mock('../ModuleCard')

const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockUseIsRobotViewable = useIsRobotViewable as jest.MockedFunction<
  typeof useIsRobotViewable
>
const mockModuleCard = ModuleCard as jest.MockedFunction<typeof ModuleCard>

const render = () => {
  return renderWithProviders(<PipettesAndModules robotName="otie" />, {
    i18nInstance: i18n,
  })
}

describe('PipettesAndModules', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders an empty state message when robot is not on the network', () => {
    mockUseIsRobotViewable.mockReturnValue(false)
    const [{ getByText }] = render()

    getByText('Robot must be on the network to see pipettes and modules')
  })

  it('renders a Module card when a robot is viewable', () => {
    mockUseIsRobotViewable.mockReturnValue(true)
    mockUseAttachedModules.mockReturnValue([mockMagneticModule])
    mockModuleCard.mockReturnValue(<div>Mock ModuleCard</div>)
    const [{ getByText }] = render()

    getByText('Mock ModuleCard')
  })
})
