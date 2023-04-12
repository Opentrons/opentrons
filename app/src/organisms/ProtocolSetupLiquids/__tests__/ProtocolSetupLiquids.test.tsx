import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import {
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
} from '@opentrons/api-client'
import { i18n } from '../../../i18n'
import { BackButton } from '../../../atoms/buttons'
import { ContinueButton } from '../../ProtocolSetupModules'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { getTotalVolumePerLiquidId } from '../../Devices/ProtocolRun/SetupLiquids/utils'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { LiquidDetails } from '../LiquidDetails'
import {
  MOCK_LABWARE_INFO_BY_LIQUID_ID,
  MOCK_LIQUIDS_IN_LOAD_ORDER,
  MOCK_PROTOCOL_ANALYSIS,
} from '../fixtures'
import { ProtocolSetupLiquids } from '..'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

jest.mock('../../Devices/ProtocolRun/SetupLiquids/utils')
jest.mock('../../ProtocolSetupModules')
jest.mock('../../../atoms/buttons')
jest.mock('../LiquidDetails')
jest.mock('../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
jest.mock('@opentrons/api-client')

const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockParseLiquidsInLoadOrder = parseLiquidsInLoadOrder as jest.MockedFunction<
  typeof parseLiquidsInLoadOrder
>
const mockParseLabwareInfoByLiquidId = parseLabwareInfoByLiquidId as jest.MockedFunction<
  typeof parseLabwareInfoByLiquidId
>
const mockLiquidDetails = LiquidDetails as jest.MockedFunction<
  typeof LiquidDetails
>
const mockBackButton = BackButton as jest.MockedFunction<typeof BackButton>
const mockContinueButton = ContinueButton as jest.MockedFunction<
  typeof ContinueButton
>
const mockgetTotalVolumePerLiquidId = getTotalVolumePerLiquidId as jest.MockedFunction<
  typeof getTotalVolumePerLiquidId
>
const render = (props: React.ComponentProps<typeof ProtocolSetupLiquids>) => {
  return renderWithProviders(<ProtocolSetupLiquids {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolSetupLiquids', () => {
  let props: React.ComponentProps<typeof ProtocolSetupLiquids>
  beforeEach(() => {
    props = { runId: RUN_ID_1, setSetupScreen: jest.fn() }
    mockParseLiquidsInLoadOrder.mockReturnValue(MOCK_LIQUIDS_IN_LOAD_ORDER)
    mockParseLabwareInfoByLiquidId.mockReturnValue(
      MOCK_LABWARE_INFO_BY_LIQUID_ID as any
    )
    mockUseMostRecentCompletedAnalysis.mockReturnValue(
      MOCK_PROTOCOL_ANALYSIS as CompletedProtocolAnalysis
    )
    mockLiquidDetails.mockReturnValue(<div>mock liquid details</div>)
    mockBackButton.mockReturnValue(<div>mock back button</div>)
    mockContinueButton.mockReturnValue(<div>mock continue button</div>)
    mockgetTotalVolumePerLiquidId.mockReturnValue(50)
  })

  it('renders the total volume of the liquid, sample display name, clicking on arrow renders the modal', () => {
    const [{ getByText, getAllByText, getByLabelText }] = render(props)
    getByText('mock liquid 1')
    getByText('mock liquid 2')
    getAllByText('50 µL')
    getByText('mock back button')
    getByText('mock continue button')
    getByLabelText('Liquids_1').click()
    getByText('mock liquid details')
  })
})
