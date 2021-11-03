import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CommandItemSuccess } from '../CommandItemStyling'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6/command'

const render = (props: React.ComponentProps<typeof CommandItemSuccess>) => {
  return renderWithProviders(<CommandItemSuccess {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const WELL_LOCATION = { origin: 'top', offset: { x: 0, y: 0, z: 0 } }
const PIPETTE_ID = 'PIPETTE_ID'
const LABWARE_ID = 'LABWARE_ID'
const WELLNAME = 'WELLNAME'
const COMMAND_TYPE = 'touchTip'

describe('CommandItemSuccess', () => {
  let props: React.ComponentProps<typeof CommandItemSuccess>

  beforeEach(() => {
    props = {
      currentCommand: {
        commandType: COMMAND_TYPE,
        params: {
          pipetteId: PIPETTE_ID,
          labwareId: LABWARE_ID,
          wellName: WELLNAME,
          wellLocation: WELL_LOCATION,
        },
        result: { volume: 10 },
      } as Command,
    }
  })
  it('renders the correct success status', () => {
    const { getByText } = render(props)
    expect(getByText('Start')).toHaveStyle('backgroundColor: C_AQUAMARINE')
    getByText('touchTip')
    getByText('End')
  })
})
