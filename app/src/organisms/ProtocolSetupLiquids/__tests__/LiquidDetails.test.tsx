import * as React from 'react'
import { screen, fireEvent } from '@testing-library/react'
import { describe, it, beforeEach, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { getLocationInfoNames } from '../../Devices/ProtocolRun/utils/getLocationInfoNames'
import { getTotalVolumePerLiquidId } from '../../Devices/ProtocolRun/SetupLiquids/utils'
import { LiquidDetails } from '../LiquidDetails'
import { LiquidsLabwareDetailsModal } from '../../Devices/ProtocolRun/SetupLiquids/LiquidsLabwareDetailsModal'
import {
  MOCK_LABWARE_INFO_BY_LIQUID_ID,
  MOCK_PROTOCOL_ANALYSIS,
} from '../fixtures'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

vi.mock('../../Devices/ProtocolRun/SetupLiquids/utils')
vi.mock('../../Devices/ProtocolRun/utils/getLocationInfoNames')
vi.mock('../../Devices/ProtocolRun/SetupLiquids/LiquidsLabwareDetailsModal')

const render = (props: React.ComponentProps<typeof LiquidDetails>) => {
  return renderWithProviders(<LiquidDetails {...props} />, {
    i18nInstance: i18n,
  })
}

describe('LiquidDetails', () => {
  let props: React.ComponentProps<typeof LiquidDetails>
  beforeEach(() => {
    props = {
      commands: (MOCK_PROTOCOL_ANALYSIS as CompletedProtocolAnalysis).commands,
      labwareByLiquidId: MOCK_LABWARE_INFO_BY_LIQUID_ID,
      runId: RUN_ID_1,
      liquid: {
        id: '0',
        displayName: 'mock liquid 1',
        description: 'mock sample',
        displayColor: '#ff4888',
      },
    }
    vi.mocked(getTotalVolumePerLiquidId).mockReturnValue(50)
    vi.mocked(getLocationInfoNames).mockReturnValue({
      slotName: '4',
      labwareName: 'mock labware name',
    })
    vi.mocked(LiquidsLabwareDetailsModal).mockReturnValue(<div>mock modal</div>)
  })

  it('renders the total volume of the liquid, sample display name, clicking on arrow renders the modal', () => {
    render(props)
    screen.getByText('4')
    screen.getByText('mock labware name')
    screen.getByText('Location')
    screen.getByText('Labware name')
    screen.getByText('Volume')
    screen.getByText('50 µL')
    fireEvent.click(screen.getByLabelText('LiquidDetails_0'))
    screen.getByText('mock modal')
  })
})
