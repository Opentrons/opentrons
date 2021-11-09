import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CommandItem } from '../CommandItem'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6/command'

const render = (props: React.ComponentProps<typeof CommandItem>) => {
  return renderWithProviders(<CommandItem {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const WELL_LOCATION = { origin: 'top', offset: { x: 0, y: 0, z: 0 } }
const PIPETTE_ID = 'PIPETTE_ID'
const LABWARE_ID = 'LABWARE_ID'
const WELLNAME = 'WELLNAME'
const COMMAND_TYPE = 'touchTip'
const COMMAND_TEXT = 'COMMAND_TEXT'

describe('Run  Details Command', () => {
  let props: React.ComponentProps<typeof CommandItem>

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
      type: 'failed',
      commandText: COMMAND_TEXT,
    }
  })

  it('renders the correct failed status', () => {
    const { getByText } = render(props)
    expect(getByText('Step failed')).toHaveStyle(
      'backgroundColor: C_ERROR_LIGHT'
    )
    getByText('Step failed')
    getByText('touchTip')
    getByText('Start')
    getByText('End')
    getByText('COMMAND_TEXT')
  })
  it('renders the correct success status', () => {
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
      type: 'succeeded',
      commandText: COMMAND_TEXT,
    }
    const { getByText } = render(props)
    expect(getByText('Start')).toHaveStyle('backgroundColor: C_AQUAMARINE')
    getByText('touchTip')
    getByText('End')
    getByText('COMMAND_TEXT')
  })
  it('renders the correct running status', () => {
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
      type: 'running',
      commandText: COMMAND_TEXT,
    }
    const { getByText } = render(props)
    expect(getByText('Current Step')).toHaveStyle(
      'backgroundColor: C_POWDER_BLUE'
    )
    getByText('touchTip')
    getByText('Start')
    getByText('End')
    getByText('COMMAND_TEXT')
  })
  it('renders the correct running status with run paused', () => {
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
      type: 'running',
      runStatus: 'paused',
      commandText: COMMAND_TEXT,
    }
    const { getByText } = render(props)
    expect(getByText('Current Step - Paused by User')).toHaveStyle(
      'backgroundColor: C_POWDER_BLUE'
    )
    getByText('touchTip')
    getByText('Start')
    getByText('End')
    getByText('Timer')
    getByText('Pause protocol')
    getByText('COMMAND_TEXT')
  })
  it('renders the correct queued status', () => {
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
      type: 'queued',
      commandText: COMMAND_TEXT,
    }
    const { getByText } = render(props)
    expect(getByText('touchTip')).toHaveStyle('backgroundColor: C_NEAR_WHITE')
    getByText('COMMAND_TEXT')
  })
})
