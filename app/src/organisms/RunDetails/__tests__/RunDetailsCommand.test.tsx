import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { RunDetailsCommand } from '../RunDetailsCommand'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6/command'

const render = (props: React.ComponentProps<typeof RunDetailsCommand>) => {
  return renderWithProviders(<RunDetailsCommand {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const WELL_LOCATION = { origin: 'top', offset: { x: 0, y: 0, z: 0 } }
const PIPETTE_ID = 'PIPETTE_ID'
const LABWARE_ID = 'LABWARE_ID'
const WELLNAME = 'WELLNAME'
const COMMAND_TYPE = 'touchTip'

describe('Run  Details Command', () => {
  let props: React.ComponentProps<typeof RunDetailsCommand>

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
    }
    const { getByText } = render(props)
    expect(getByText('Start')).toHaveStyle('backgroundColor: C_AQUAMARINE')
    getByText('touchTip')
    getByText('End')
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
    }
    const { getByText } = render(props)
    expect(getByText('Current Step')).toHaveStyle(
      'backgroundColor: C_POWDER_BLUE'
    )
    getByText('touchTip')
    getByText('Start')
    getByText('End')
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
    }
    const { getByText } = render(props)
    expect(getByText('touchTip')).toHaveStyle('backgroundColor: C_NEAR_WHITE')
  })
})
