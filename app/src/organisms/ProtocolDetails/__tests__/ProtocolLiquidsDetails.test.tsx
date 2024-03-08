import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, beforeEach, vi } from 'vitest'
import {
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
} from '@opentrons/api-client'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ProtocolLiquidsDetails } from '../ProtocolLiquidsDetails'
import { LiquidsListItemDetails } from '../../Devices/ProtocolRun/SetupLiquids/SetupLiquidsList'

vi.mock('../../Devices/ProtocolRun/SetupLiquids/SetupLiquidsList')
vi.mock('@opentrons/api-client')

const render = (props: React.ComponentProps<typeof ProtocolLiquidsDetails>) => {
  return renderWithProviders(<ProtocolLiquidsDetails {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolLiquidsDetails', () => {
  let props: React.ComponentProps<typeof ProtocolLiquidsDetails>
  beforeEach(() => {
    props = {
      commands: [],
      liquids: [
        {
          id: 'mockLiquid',
          displayName: 'mockDisplayName',
          description: 'mockDescription',
        },
      ],
    }
    vi.mocked(LiquidsListItemDetails).mockReturnValue(
      <div>mock liquids list item</div>
    )
    vi.mocked(parseLiquidsInLoadOrder).mockReturnValue([
      {
        id: '1',
        displayName: 'mock liquid',
        description: '',
        displayColor: '#FFFFFF',
      },
    ])
    vi.mocked(parseLabwareInfoByLiquidId).mockReturnValue({
      '1': [{ labwareId: '123', volumeByWell: { A1: 30 } }],
    })
  })
  it('renders the display name, description and total volume', () => {
    render(props)
    screen.getAllByText('mock liquids list item')
  })
  it('renders the correct info for no liquids in the protocol', () => {
    props.liquids = []
    vi.mocked(parseLiquidsInLoadOrder).mockReturnValue([])
    render(props)
    screen.getByText('No liquids are specified for this protocol')
    screen.getByLabelText('ProtocolLIquidsDetails_noLiquidsIcon')
  })
})
