import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  SPACING_1,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  FONT_WEIGHT_BOLD,
  FONT_SIZE_CAPTION,
  Icon,
  TEXT_TRANSFORM_UPPERCASE,
  FONT_WEIGHT_REGULAR,
  C_DARK_GRAY,
  COLOR_ERROR,
  ALIGN_CENTER,
  SPACING_3,
  FONT_SIZE_BODY_1,
  C_NEAR_WHITE,
  C_AQUAMARINE,
  C_MINT,
  SPACING_2,
  C_ERROR_LIGHT,
  C_POWDER_BLUE,
} from '@opentrons/components'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6/command'

export type Status = 'queued' | 'running' | 'succeeded' | 'failed'
export interface RunDetailsCommandProps {
  //  the Command
  currentCommand: Command
  //    the status type of the command
  type: Status
  //    run status
  runStatus?: string
}

const RUN_DETAIL_COMMAND_PROPS_BY_TYPE: Record<
  Status,
  { className: string }
> = {
  queued: { className: 'queued' },
  running: { className: 'running' },
  succeeded: { className: 'success' },
  failed: { className: 'failed' },
}

const PLACEHOLDERTIMER = '00:00:00' //  TODO: immediately add timer
const PLACEHOLDER_COMMANDS =
  '(this is a placeholder for the actual command info)' //  TODO: immediately

export function RunDetailsCommand(props: RunDetailsCommandProps): JSX.Element {
  const { currentCommand, runStatus } = props
  const { t } = useTranslation('run_details')
  const commandProps = RUN_DETAIL_COMMAND_PROPS_BY_TYPE[props.type]
  const className = commandProps.className

  let statusBackgroundColor = ''
  if (className === 'running') {
    statusBackgroundColor = C_POWDER_BLUE
  } else if (className === 'queued') {
    statusBackgroundColor = C_NEAR_WHITE
  } else if (className === 'success') {
    statusBackgroundColor = C_AQUAMARINE
  } else if (className === 'failed') {
    statusBackgroundColor = C_ERROR_LIGHT
  }

  let statusBorder = ''
  if (className === 'running') {
    statusBorder = `1px solid ${C_MINT}`
  } else if (className === 'failed') {
    statusBorder = `1px solid ${COLOR_ERROR}`
  } else {
    statusBorder = ''
  }
  return (
    <Flex
      className={className}
      fontSize={FONT_SIZE_BODY_1}
      backgroundColor={statusBackgroundColor}
      border={statusBorder}
      padding={SPACING_2}
      color={C_DARK_GRAY}
    >
      <Flex flexDirection={DIRECTION_ROW}>
        <Flex flexDirection={DIRECTION_COLUMN}>
          {className === 'running' ? (
            <Flex
              fontWeight={FONT_WEIGHT_BOLD}
              fontSize={FONT_SIZE_CAPTION}
              marginBottom={SPACING_1}
              marginTop={SPACING_1}
              textTransform={TEXT_TRANSFORM_UPPERCASE}
            >
              {runStatus === 'paused'
                ? t('current_step_pause')
                : t('current_step')}
            </Flex>
          ) : null}
          {className !== 'queued' ? (
            <Flex
              flexDirection={DIRECTION_COLUMN}
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              fontSize={FONT_SIZE_CAPTION}
              fontWeight={FONT_WEIGHT_REGULAR}
            >
              <Flex flexDirection={DIRECTION_ROW}>
                <Flex marginRight={SPACING_1}>{t('start_step_time')}</Flex>
                <Flex>{PLACEHOLDERTIMER} </Flex>
              </Flex>
              {className === 'running' && runStatus === 'paused' ? (
                <Flex flexDirection={DIRECTION_ROW}>
                  <Flex marginRight={SPACING_1}>
                    {t('current_step_pause_timer')}
                  </Flex>
                  <Flex>{PLACEHOLDERTIMER} </Flex>
                </Flex>
              ) : null}
              <Flex flexDirection={DIRECTION_ROW}>
                <Flex marginRight={SPACING_1}>{t('end_step_time')}</Flex>
                <Flex marginLeft={SPACING_2}>{PLACEHOLDERTIMER} </Flex>
              </Flex>
            </Flex>
          ) : null}
        </Flex>
        {className === 'failed' ? (
          <Flex flexDirection={DIRECTION_ROW} color={COLOR_ERROR}>
            <Flex margin={SPACING_1} width={SPACING_3}>
              <Icon name="information" />
            </Flex>
            <Flex alignItems={ALIGN_CENTER}>{t('step_failed')}</Flex>
          </Flex>
        ) : null}
        <Flex flexDirection={DIRECTION_COLUMN}>
          {className !== 'queued' ? (
            <Flex
              marginLeft={SPACING_3}
              flex={'auto'}
              alignItems={ALIGN_CENTER}
              flexDirection={DIRECTION_ROW}
            >
              <Flex>{currentCommand.commandType} </Flex>
              <Flex marginLeft={SPACING_1}>{PLACEHOLDER_COMMANDS}</Flex>
            </Flex>
          ) : (
            <Flex flexDirection={DIRECTION_ROW}>
              <Flex>{currentCommand.commandType} </Flex>
              <Flex marginLeft={SPACING_1}>{PLACEHOLDER_COMMANDS}</Flex>
            </Flex>
          )}
          {className === 'running' && runStatus === 'paused' ? (
            <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
              <Flex
                marginTop={SPACING_1}
                marginBottom={SPACING_1}
                marginRight={SPACING_1}
                marginLeft={SPACING_3}
                width={SPACING_3}
              >
                <Icon name="pause" />
              </Flex>
              <Flex>{t('pause_protocol')}</Flex>
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    </Flex>
  )
}
