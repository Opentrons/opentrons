import * as React from 'react'
import { describe, it, beforeEach, vi } from 'vitest'
import {
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
} from '@opentrons/api-client'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
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
import { screen, fireEvent } from '@testing-library/react'

vi.mock('../../Devices/ProtocolRun/SetupLiquids/utils')
vi.mock('../../../atoms/buttons')
vi.mock('../LiquidDetails')
vi.mock('../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
vi.mock('@opentrons/api-client')

const render = (props: React.ComponentProps<typeof ProtocolSetupLiquids>) => {
  return renderWithProviders(<ProtocolSetupLiquids {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolSetupLiquids', () => {
  let props: React.ComponentProps<typeof ProtocolSetupLiquids>
  beforeEach(() => {
    props = { runId: RUN_ID_1, setSetupScreen: vi.fn() }
    vi.mocked(parseLiquidsInLoadOrder).mockReturnValue(
      MOCK_LIQUIDS_IN_LOAD_ORDER
    )
    vi.mocked(parseLabwareInfoByLiquidId).mockReturnValue(
      MOCK_LABWARE_INFO_BY_LIQUID_ID as any
    )
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue(
      MOCK_PROTOCOL_ANALYSIS as CompletedProtocolAnalysis
    )
    vi.mocked(LiquidDetails).mockReturnValue(<div>mock liquid details</div>)
    vi.mocked(getTotalVolumePerLiquidId).mockReturnValue(50)
  })

  it('renders the total volume of the liquid, sample display name, clicking on arrow renders the modal', () => {
    render(props)
    screen.getByText('mock liquid 1')
    screen.getByText('mock liquid 2')
    screen.getAllByText('50 µL')
    fireEvent.click(screen.getByLabelText('Liquids_1'))
    screen.getByText('mock liquid details')
  })
})
