import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { useModulesQuery, usePipettesQuery } from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { Banner } from '../../../atoms/Banner'
import { mockMagneticModule } from '../../../redux/modules/__fixtures__'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { useIsRobotViewable, useRunStatuses } from '../hooks'
import { ModuleCard } from '../../ModuleCard'
import { InstrumentsAndModules } from '../InstrumentsAndModules'
import { PipetteCard } from '../PipetteCard'

jest.mock('@opentrons/react-api-client')
jest.mock('../hooks')
jest.mock('../../ModuleCard')
jest.mock('../PipetteCard')
jest.mock('../../ProtocolUpload/hooks')
jest.mock('../../../atoms/Banner')
jest.mock('../../RunTimeControl/hooks')

const mockUseModulesQuery = useModulesQuery as jest.MockedFunction<
  typeof useModulesQuery
>
const mockUseIsRobotViewable = useIsRobotViewable as jest.MockedFunction<
  typeof useIsRobotViewable
>
const mockModuleCard = ModuleCard as jest.MockedFunction<typeof ModuleCard>
const mockPipetteCard = PipetteCard as jest.MockedFunction<typeof PipetteCard>
const mockUsePipettesQuery = usePipettesQuery as jest.MockedFunction<
  typeof usePipettesQuery
>
const mockBanner = Banner as jest.MockedFunction<typeof Banner>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseRunStatuses = useRunStatuses as jest.MockedFunction<
  typeof useRunStatuses
>

const render = () => {
  return renderWithProviders(<InstrumentsAndModules robotName="otie" />, {
    i18nInstance: i18n,
  })
}

describe('InstrumentsAndModules', () => {
  beforeEach(() => {
    mockUseCurrentRunId.mockReturnValue(null)
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: false,
      isRunIdle: false,
      isRunStill: true,
      isRunTerminal: false,
    })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders an empty state message when robot is not on the network', () => {
    mockUseIsRobotViewable.mockReturnValue(false)
    const [{ getByText }] = render()

    getByText(
      'Robot must be on the network to see connected instruments and modules'
    )
  })

  it('renders a Module card when a robot is viewable', () => {
    mockUseIsRobotViewable.mockReturnValue(true)
    mockUseModulesQuery.mockReturnValue({
      data: { data: [mockMagneticModule] },
    } as any)
    mockUsePipettesQuery.mockReturnValue({
      data: {
        left: null,
        right: null,
      },
    } as any)
    mockPipetteCard.mockReturnValue(<div>Mock PipetteCard</div>)
    mockModuleCard.mockReturnValue(<div>Mock ModuleCard</div>)
    const [{ getByText }] = render()

    getByText('Mock ModuleCard')
  })
  it('renders a pipette card when a robot is viewable', () => {
    mockUseIsRobotViewable.mockReturnValue(true)
    mockUseModulesQuery.mockReturnValue({
      data: { data: [mockMagneticModule] },
    } as any)
    mockUsePipettesQuery.mockReturnValue({
      data: {
        left: null,
        right: null,
      },
    } as any)
    mockPipetteCard.mockReturnValue(<div>Mock PipetteCard</div>)
    mockModuleCard.mockReturnValue(<div>Mock ModuleCard</div>)
    const [{ getAllByText }] = render()
    getAllByText('Mock PipetteCard')
  })
  it('renders the protocol loaded banner when protocol is loaded and not terminal state', () => {
    mockUseCurrentRunId.mockReturnValue('RUNID')
    mockBanner.mockReturnValue(<div>mock Banner</div>)
    const [{ getByText }] = render()

    getByText('mock Banner')
  })
})
