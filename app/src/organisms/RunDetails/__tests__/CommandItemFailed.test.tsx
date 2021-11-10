import * as React from 'react'
import { when } from 'jest-when'
import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CommandItemFailed } from '../CommandItem'
import { CommandText } from '../CommandText'
import { CommandTimer } from '../CommandTimer'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6/command'

jest.mock('../CommandText')
jest.mock('../CommandTimer')

const mockCommandText = CommandText as jest.MockedFunction<typeof CommandText>
const mockCommandTimer = CommandTimer as jest.MockedFunction<
  typeof CommandTimer
>

const render = (props: React.ComponentProps<typeof CommandItemFailed>) => {
  return renderWithProviders(<CommandItemFailed {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const WELL_LOCATION = { origin: 'top', offset: { x: 0, y: 0, z: 0 } }
const PIPETTE_ID = 'PIPETTE_ID'
const LABWARE_ID = 'LABWARE_ID'
const WELLNAME = 'WELLNAME'
const COMMAND_TYPE = 'touchTip'

describe('CommandItemFailed', () => {
  let props: React.ComponentProps<typeof CommandItemFailed>

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
    when(mockCommandText)
      .calledWith(
        partialComponentPropsMatcher({
          commandText: 'COMMAND_TEXT',
        })
      )
      .mockReturnValue(<div>Mock Command Text</div>)
    mockCommandTimer.mockReturnValue(<div>Mock Command Timer</div>)
  })
  it('renders the correct failed status', () => {
    const { getByText } = render(props)
    expect(getByText('Step failed')).toHaveStyle(
      'backgroundColor: C_ERROR_LIGHT'
    )
    getByText('Step failed')
    getByText('Mock Command Text')
    getByText('Mock Command Timer')
  })
})
