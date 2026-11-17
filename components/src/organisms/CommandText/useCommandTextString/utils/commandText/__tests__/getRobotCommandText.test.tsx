import { useTranslation } from 'react-i18next'
import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { i18n } from '../../../../../../i18n'
import { renderWithProviders } from '../../../../../../testing/utils'
import { getRobotCommandText } from '../getRobotCommandText'

import type { ReactNode } from 'react'
import type { HandlesCommands } from '../../types'
import type { SupportedCommands } from '../getRobotCommandText'

function TestWrapper({ command }: { command: SupportedCommands }): ReactNode {
  const { t } = useTranslation('protocol_command_text')
  const text = getRobotCommandText({
    command,
    t,
  } as HandlesCommands<SupportedCommands>)
  return <div>{text}</div>
}

const render = (command: any) => {
  return renderWithProviders(<TestWrapper command={command} />, {
    i18nInstance: i18n,
  })
}

describe('getRobotCommandText', () => {
  it('should render openGripperJaw', () => {
    render({ commandType: 'robot/openGripperJaw' } as SupportedCommands)
    screen.getByText(/Opening robot gripper jaw/)
  })
  it('should render closeGripperJaw', () => {
    render({ commandType: 'robot/closeGripperJaw' } as SupportedCommands)
    screen.getByText(/Closing robot gripper jaw/)
  })
  ;(['left', 'right', 'extension'] as const).forEach(mountName =>
    it(`should render moveAxes {mountName}`, () => {
      render({
        commandType: 'robot/moveTo',
        params: { destination: { x: 1, y: 2, z: 3 }, mount: mountName },
      })
      screen.getByText(`Moving ${mountName} mount to (X: 1, Y: 2, Z: 3)`)
    })
  )

  it('should render moveAxesTo with all axes', () => {
    render({
      commandType: 'robot/moveAxesTo',
      params: {
        axis_map: {
          x: 1,
          y: 2,
          leftZ: 3,
          rightZ: 4,
          extensionZ: 5,
          leftPlunger: 6,
          rightPlunger: 7,
          extensionJaw: 8,
          axis96ChannelCam: 9,
        },
      },
    })
    screen.getByText(
      'Moving robot to (X: 1, Y: 2, left Z: 3, right Z: 4, extension Z: 5, left plunger: 6, right plunger: 7, extension jaw: 8, pipette tip attach cam: 9)'
    )
  })
  it('should render moveAxesTo with not all axes', () => {
    render({
      commandType: 'robot/moveAxesTo',
      params: {
        axis_map: {
          x: 1,
          rightZ: 4,
          extensionZ: 5,
          rightPlunger: 7,
        },
      },
    })
    screen.getByText(
      'Moving robot to (X: 1, right Z: 4, extension Z: 5, right plunger: 7)'
    )
  })
  it('should render moveAxesRelative with all axes', () => {
    render({
      commandType: 'robot/moveAxesRelative',
      params: {
        axis_map: {
          x: 1,
          y: 2,
          leftZ: 3,
          rightZ: 4,
          extensionZ: 5,
          leftPlunger: 6,
          rightPlunger: 7,
          extensionJaw: 8,
          axis96ChannelCam: 9,
        },
      },
    })
    screen.getByText(
      'Moving robot by (X: 1, Y: 2, left Z: 3, right Z: 4, extension Z: 5, left plunger: 6, right plunger: 7, extension jaw: 8, pipette tip attach cam: 9)'
    )
  })
  it('should render moveAxesRelative with not all axes', () => {
    render({
      commandType: 'robot/moveAxesRelative',
      params: {
        axis_map: {
          x: 1,
          rightZ: 4,
          extensionZ: 5,
          rightPlunger: 7,
        },
      },
    })
    screen.getByText(
      'Moving robot by (X: 1, right Z: 4, extension Z: 5, right plunger: 7)'
    )
  })
})
