import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CommandItemQueued } from '../CommandItem'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6/command'

const render = (props: React.ComponentProps<typeof CommandItemQueued>) => {
  return renderWithProviders(<CommandItemQueued {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const WELL_LOCATION = { origin: 'top', offset: { x: 0, y: 0, z: 0 } }
const PIPETTE_ID = 'PIPETTE_ID'
const LABWARE_ID = 'LABWARE_ID'
const WELLNAME = 'WELLNAME'
const COMMAND_TYPE = 'touchTip'

describe('CommandItemQueued', () => {
  let props: React.ComponentProps<typeof CommandItemQueued>

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
      commandText: 'COMMAND_TEXT',
    }
  })
  it('renders the correct queued status', () => {
    const { getByText } = render(props)
    expect(getByText('touchTip')).toHaveStyle('backgroundColor: C_NEAR_WHITE')
  })
})
