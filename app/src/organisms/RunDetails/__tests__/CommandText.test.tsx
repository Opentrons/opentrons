import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CommandText } from '../CommandText'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6/command'

const render = (props: React.ComponentProps<typeof CommandText>) => {
  return renderWithProviders(<CommandText {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const WELL_LOCATION = { origin: 'top', offset: { x: 0, y: 0, z: 0 } }
const PIPETTE_ID = 'PIPETTE_ID'
const LABWARE_ID = 'LABWARE_ID'
const WELLNAME = 'WELLNAME'
const COMMAND_TYPE = 'touchTip'
const COMMAND_TEXT = ('COMMAND_TEXT' as unknown) as JSX.Element

describe('CommandText', () => {
  let props: React.ComponentProps<typeof CommandText>

  beforeEach(() => {
    props = {
      command: {
        commandType: COMMAND_TYPE,
        params: {
          pipetteId: PIPETTE_ID,
          labwareId: LABWARE_ID,
          wellName: WELLNAME,
          wellLocation: WELL_LOCATION,
        },
        result: { volume: 10 },
      } as Command,
      commandText: COMMAND_TEXT,
    }
  })
  it('renders correct command text', () => {
    const { getByText } = render(props)
    getByText('touchTip')
    getByText('COMMAND_TEXT')
  })
})
