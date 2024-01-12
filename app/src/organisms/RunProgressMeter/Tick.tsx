import * as React from 'react'
import { RunTimeCommand } from '@opentrons/shared-data'
import {
  Flex,
  Icon,
  useHoverTooltip,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  LEGACY_COLORS,
  SPACING,
  DIRECTION_COLUMN,
} from '@opentrons/components'

import { Tooltip } from '../../atoms/Tooltip'
import { Portal } from '../../App/portal'
import { StyledText } from '../../atoms/text'
import { useTranslation } from 'react-i18next'
import type { IconName } from '@opentrons/components'

interface TickProps {
  index: number
  count: number
  range: number
  firstCommandType: RunTimeCommand['commandType']
  makeHandleJumpToStep: (i: number) => () => void
  total: number
}

const TRANSLATION_KEY_BY_COMMAND_TYPE: {
  [commandType in RunTimeCommand['commandType']]?: string
} = {
  waitForResume: 'pause',
  moveLabware: 'move_labware',
}
const ICON_NAME_BY_COMMAND_TYPE: {
  [commandType in RunTimeCommand['commandType']]?: IconName
} = {
  waitForResume: 'pause-circle',
  moveLabware: 'move-xy',
}
export function Tick(props: TickProps): JSX.Element {
  const {
    index,
    count,
    range,
    firstCommandType,
    makeHandleJumpToStep,
    total,
  } = props
  const { t } = useTranslation('run_details')

  const [targetProps, tooltipProps] = useHoverTooltip()
  const isAggregatedTick = count > 1
  const stepNumber = index + 1
  const percent = (stepNumber / total) * 100
  const commandTKey =
    firstCommandType in TRANSLATION_KEY_BY_COMMAND_TYPE &&
    TRANSLATION_KEY_BY_COMMAND_TYPE[firstCommandType] != null
      ? TRANSLATION_KEY_BY_COMMAND_TYPE[firstCommandType] ?? null
      : null
  const iconName =
    firstCommandType in ICON_NAME_BY_COMMAND_TYPE &&
    ICON_NAME_BY_COMMAND_TYPE[firstCommandType] != null
      ? ICON_NAME_BY_COMMAND_TYPE[firstCommandType] ?? null
      : null
  return (
    <Flex
      {...targetProps}
      cursor="pointer"
      onClick={makeHandleJumpToStep(index)}
      backgroundColor={COLORS.white}
      fontSize="9px"
      borderRadius="4px"
      border={`${COLORS.blue50} 1px solid`}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      height="0.75rem"
      width={isAggregatedTick ? '0.75rem' : '0.25rem'}
      position="absolute"
      top="-50%"
      left={`${percent}%`}
      transform={`translateX(-${percent}%)`}
    >
      <StyledText as="h6">{isAggregatedTick ? count : null}</StyledText>
      <Portal>
        <Tooltip tooltipProps={tooltipProps}>
          <Flex
            padding={SPACING.spacing2}
            gridGap={SPACING.spacing4}
            alignItems={ALIGN_CENTER}
          >
            {!isAggregatedTick && iconName != null ? (
              <Icon name={iconName} size={SPACING.spacing20} />
            ) : null}
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText as="label">
                {t('step_number', {
                  step_number: isAggregatedTick
                    ? `${stepNumber} - ${stepNumber + range}`
                    : stepNumber,
                })}
              </StyledText>
              <StyledText as="label">
                {commandTKey != null ? t(commandTKey) : null}
              </StyledText>
              {isAggregatedTick ? (
                <StyledText>{t('plus_more', { count })}</StyledText>
              ) : null}
            </Flex>
          </Flex>
        </Tooltip>
      </Portal>
    </Flex>
  )
}
