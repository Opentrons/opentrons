import * as React from 'react'
import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CommandItem } from '../CommandItem'
import { CommandText } from '../CommandText'
import { CommandTimer } from '../CommandTimer'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6/command'
import { when } from 'jest-when'

jest.mock('../CommandText')
jest.mock('../CommandTimer')

const mockCommandText = CommandText as jest.MockedFunction<typeof CommandText>
const mockCommandTimer = CommandTimer as jest.MockedFunction<
  typeof CommandTimer
>
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
const COMMAND_TEXT = ('COMMAND_TEXT' as unknown) as JSX.Element

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
    getByText('Mock Command Text')
    getByText('Mock Command Timer')
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
    expect(getByText('Mock Command Timer')).toHaveStyle(
      'backgroundColor: C_AQUAMARINE'
    )
    getByText('Mock Command Text')
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
    getByText('Mock Command Timer')
    getByText('Mock Command Text')
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
    when(mockCommandTimer)
      .calledWith(partialComponentPropsMatcher({ timer: 0 }))
      .mockReturnValue(<div>Mock Command Timer</div>)

    const { getByText } = render(props)
    expect(getByText('Current Step - Paused by User')).toHaveStyle(
      'backgroundColor: C_POWDER_BLUE'
    )
    getByText('Mock Command Timer')
    getByText('Mock Command Text')
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
      commandText: COMMAND_TEXT,
    }
    const { getByText } = render(props)
    expect(getByText('touchTip')).toHaveStyle('backgroundColor: C_NEAR_WHITE')
    getByText('COMMAND_TEXT')
  })
  describe('CommandItemFailed', () => {
    beforeEach(() => {
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
  describe('CommandItemQueued', () => {
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
    })
  })
  describe('CommandItemRunning', () => {
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
        type: 'running',
        commandText: COMMAND_TEXT,
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
    it('renders the correct running status', () => {
      const { getByText } = render(props)
      expect(getByText('Current Step')).toHaveStyle(
        'backgroundColor: C_POWDER_BLUE'
      )
      getByText('Mock Command Text')
      getByText('Mock Command Timer')
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
        runStatus: 'paused',
        type: 'running',
        commandText: COMMAND_TEXT,
      }
      when(mockCommandTimer)
        .calledWith(
          partialComponentPropsMatcher({
            start: '0',
            timer: '0',
            end: '0',
          })
        )
        .mockReturnValue(<div>Mock Command Timer</div>)
      const { getByText } = render(props)
      expect(getByText('Current Step - Paused by User')).toHaveStyle(
        'backgroundColor: C_POWDER_BLUE'
      )
      getByText('Mock Command Text')
      getByText('Mock Command Timer')
      getByText('Pause protocol')
    })
  })
  describe('CommandItemSuccess', () => {
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
        type: 'succeeded',
        commandText: COMMAND_TEXT,
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
    it('renders the correct success status', () => {
      const { getByText } = render(props)
      expect(getByText('Mock Command Text')).toHaveStyle(
        'backgroundColor: C_AQUAMARINE'
      )
      getByText('Mock Command Timer')
      getByText('Mock Command Text')
    })
  })
})
