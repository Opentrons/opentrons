import {
  ALIGN_CENTER,
  COLOR_ERROR,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  FONT_SIZE_CAPTION,
  FONT_WEIGHT_BOLD,
  Icon,
  SPACING_1,
  SPACING_3,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6/command'
import { CommandTimer } from './CommandTimer'
import { CommandText } from './CommandText'

const PLACEHOLDERTIMER = '00:00:00' //  TODO: immediately add timer

interface CommandItemRunningProps {
  runStatus?: string
  currentCommand: Command
}
export function CommandItemRunning(
  props: CommandItemRunningProps
): JSX.Element {
  const { currentCommand, runStatus } = props
  const { t } = useTranslation('run_details')
  return (
    <Flex flexDirection={DIRECTION_ROW}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex
          fontWeight={FONT_WEIGHT_BOLD}
          marginBottom={SPACING_1}
          marginTop={SPACING_1}
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          fontSize={FONT_SIZE_CAPTION}
        >
          {runStatus === 'paused' ? t('current_step_pause') : t('current_step')}
        </Flex>
        <CommandTimer
          start={PLACEHOLDERTIMER}
          timer={PLACEHOLDERTIMER}
          end={PLACEHOLDERTIMER}
          runStatus={'paused'}
        />
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <CommandText command={currentCommand} />
        {runStatus === 'paused' ? (
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
  )
}

interface CommandItemStylingProps {
  currentCommand: Command
}
export function CommandItemQueued(props: CommandItemStylingProps): JSX.Element {
  const { currentCommand } = props
  return (
    <Flex>
      <Flex>{currentCommand.commandType} </Flex>
      <Flex marginLeft={SPACING_1}>
        {'(this is a placeholder for the actual command info)'}
      </Flex>
    </Flex>
  )
}

export function CommandItemSuccess(
  props: CommandItemStylingProps
): JSX.Element {
  const { currentCommand } = props
  return (
    <Flex flexDirection={DIRECTION_ROW}>
      <CommandTimer start={PLACEHOLDERTIMER} end={PLACEHOLDERTIMER} />
      <CommandText command={currentCommand} />
    </Flex>
  )
}

export function CommandItemFailed(props: CommandItemStylingProps): JSX.Element {
  const { currentCommand } = props
  const { t } = useTranslation('run_details')
  return (
    <Flex flexDirection={DIRECTION_ROW}>
      <CommandTimer start={PLACEHOLDERTIMER} end={PLACEHOLDERTIMER} />
      <Flex flexDirection={DIRECTION_ROW} color={COLOR_ERROR}>
        <Flex margin={SPACING_1} width={SPACING_3}>
          <Icon name="information" />
        </Flex>
        <Flex alignItems={ALIGN_CENTER}>{t('step_failed')}</Flex>
      </Flex>
      <CommandText command={currentCommand} />
    </Flex>
  )
}
