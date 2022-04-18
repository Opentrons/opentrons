import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { mockMagneticModule } from '../../../redux/modules/__fixtures__'
import {
  useAttachedModules,
  useAttachedPipettes,
  useIsRobotViewable,
} from '../hooks'
import { ModuleCard } from '../ModuleCard'
import { PipettesAndModules } from '../PipettesAndModules'
import { PipetteCard } from '../PipetteCard'

jest.mock('../hooks')
jest.mock('../ModuleCard')
jest.mock('../PipetteCard')

const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockUseIsRobotViewable = useIsRobotViewable as jest.MockedFunction<
  typeof useIsRobotViewable
>
const mockModuleCard = ModuleCard as jest.MockedFunction<typeof ModuleCard>
const mockPipetteCard = PipetteCard as jest.MockedFunction<typeof PipetteCard>
const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>

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
    mockUseAttachedPipettes.mockReturnValue({
      left: null,
      right: null,
    })
    mockPipetteCard.mockReturnValue(<div>Mock PipetteCard</div>)
    mockModuleCard.mockReturnValue(<div>Mock ModuleCard</div>)
    const [{ getByText }] = render()

    getByText('Mock ModuleCard')
  })
  it('renders a pipette card when a robot is viewable', () => {
    mockUseIsRobotViewable.mockReturnValue(true)
    mockUseAttachedModules.mockReturnValue([mockMagneticModule])
    mockPipetteCard.mockReturnValue(<div>Mock PipetteCard</div>)
    mockModuleCard.mockReturnValue(<div>Mock ModuleCard</div>)
    mockUseAttachedPipettes.mockReturnValue({
      left: null,
      right: null,
    })
    const [{ getAllByText }] = render()
    getAllByText('Mock PipetteCard')
  })
})
