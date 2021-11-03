import * as React from 'react'
import {
  DIRECTION_ROW,
  Flex,
  C_DARK_GRAY,
  COLOR_ERROR,
  FONT_SIZE_BODY_1,
  C_NEAR_WHITE,
  C_AQUAMARINE,
  C_MINT,
  SPACING_2,
  C_ERROR_LIGHT,
  C_POWDER_BLUE,
} from '@opentrons/components'
import { css } from 'styled-components'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6/command'
import {
  CommandItemFailed,
  CommandItemQueued,
  CommandItemRunning,
  CommandItemSuccess,
} from './CommandItemStyling'

export type Status = 'queued' | 'running' | 'succeeded' | 'failed'

export interface CommandItemProps {
  currentCommand: Command
  type: Status
  runStatus?: string
}

const WRAPPER_STYLE_BY_STATUS: Record<
  Status,
  { border: string; backgroundColor: string }
> = {
  queued: { border: '', backgroundColor: C_NEAR_WHITE },
  running: {
    border: `1px solid ${C_MINT}`,
    backgroundColor: C_POWDER_BLUE,
  },
  succeeded: {
    border: '',
    backgroundColor: C_AQUAMARINE,
  },
  failed: {
    border: `1px solid ${COLOR_ERROR}`,
    backgroundColor: C_ERROR_LIGHT,
  },
}
export function CommandItem(props: CommandItemProps): JSX.Element {
  const { currentCommand, runStatus, type } = props

  const WRAPPER_STYLE = css`
    font-size: ${FONT_SIZE_BODY_1};
    background-color: ${WRAPPER_STYLE_BY_STATUS[type].backgroundColor};
    border: ${WRAPPER_STYLE_BY_STATUS[type].border};
    padding: ${SPACING_2};
    color: ${C_DARK_GRAY};
    flexdirection: ${DIRECTION_ROW};
  `
  let commandType
  if (type === 'running') {
    commandType = (
      <CommandItemRunning
        runStatus={runStatus}
        currentCommand={currentCommand}
      />
    )
  } else if (type === 'failed') {
    commandType = <CommandItemFailed currentCommand={currentCommand} />
  } else if (type === 'queued') {
    commandType = <CommandItemQueued currentCommand={currentCommand} />
  } else if (type === 'succeeded') {
    commandType = <CommandItemSuccess currentCommand={currentCommand} />
  }
  return <Flex css={WRAPPER_STYLE}>{commandType}</Flex>
}
