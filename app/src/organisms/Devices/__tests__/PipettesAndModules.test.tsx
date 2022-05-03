import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { Banner } from '../../../atoms/Banner'
import { mockMagneticModule } from '../../../redux/modules/__fixtures__'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
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
jest.mock('../../ProtocolUpload/hooks')
jest.mock('../../../atoms/Banner')

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
const mockBanner = Banner as jest.MockedFunction<typeof Banner>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>

const render = () => {
  return renderWithProviders(<PipettesAndModules robotName="otie" />, {
    i18nInstance: i18n,
  })
}

describe('PipettesAndModules', () => {
  beforeEach(() => {
    mockUseCurrentRunId.mockReturnValue(null)
  })
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
  it('renders the protocol loaded banner when protocol is loaded', () => {
    mockUseCurrentRunId.mockReturnValue('RUNID')
    mockBanner.mockReturnValue(<div>mock Banner</div>)
    const [{ getByText }] = render()

    getByText('mock Banner')
  })
})
