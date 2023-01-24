import * as React from 'react'
import { RunTimeCommand } from '@opentrons/shared-data'
import { css } from 'styled-components'
import {
  Flex,
  Icon,
  useHoverTooltip,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  COLORS,
  BORDERS,
  SPACING,
  DIRECTION_COLUMN,
} from '@opentrons/components'

import { Tooltip } from '../../../atoms/Tooltip'
import { Portal } from '../../../App/portal'
import { ProgressBar } from '../../../atoms/ProgressBar'
import { StyledText } from '../../../atoms/text'
import { useTranslation } from 'react-i18next'
import type { IconName } from '@opentrons/components'

interface RunProgressMeterProps {
  analysisCommands: RunTimeCommand[]
  ticks: Array<{ index: number; count: number; range: number }>
  makeHandleJumpToStep: (i: number) => () => void
  lastRunCommandIndex: number
}

export function RunProgressMeter(props: RunProgressMeterProps): JSX.Element {
  const {
    ticks,
    analysisCommands,
    makeHandleJumpToStep,
    lastRunCommandIndex,
  } = props
  return (
    <ProgressBar
      percentComplete={
        lastRunCommandIndex > 0
          ? ((lastRunCommandIndex + 1) / analysisCommands.length) * 100
          : 0
      }
      outerStyles={css`
        height: 0.375rem;
        background-color: ${COLORS.medGreyEnabled};
        border-radius: ${BORDERS.radiusSoftCorners};
        position: relative;
        overflow: initial;
      `}
      innerStyles={css`
        height: 0.375rem;
        background-color: ${COLORS.darkBlackEnabled};
        border-radius: ${BORDERS.radiusSoftCorners};
      `}
    >
      {ticks.map(tick => (
        <Tick
          key={tick.index}
          {...{
            ...tick,
            makeHandleJumpToStep,
            firstCommandType: analysisCommands[tick.index]?.commandType,
          }}
          total={analysisCommands.length}
        />
      ))}
    </ProgressBar>
  )
}

interface TickProps {
  index: number
  count: number
  range: number
  firstCommandType: RunTimeCommand['commandType']
  makeHandleJumpToStep: (i: number) => () => void
  total: number
}

function Tick(props: TickProps): JSX.Element {
  const {
    index,
    count,
    range,
    firstCommandType,
    makeHandleJumpToStep,
    total,
  } = props
  const { t } = useTranslation('run_details')

  const tKeyByCommandType: {
    [commandType in RunTimeCommand['commandType']]?: string
  } = {
    waitForResume: 'pause',
    moveLabware: 'move_labware',
  }
  const iconByCommandType: {
    [commandType in RunTimeCommand['commandType']]?: IconName
  } = {
    waitForResume: 'pause-circle',
    moveLabware: 'move-xy',
  }
  const [targetProps, tooltipProps] = useHoverTooltip()
  const isAggregatedTick = count > 1
  const percent = (index / (total - 1)) * 100
  const stepNumber = index + 1

  const commandTKey =
    firstCommandType in tKeyByCommandType &&
    tKeyByCommandType[firstCommandType] != null
      ? tKeyByCommandType[firstCommandType] ?? null
      : null
  const iconName =
    firstCommandType in iconByCommandType &&
    iconByCommandType[firstCommandType] != null
      ? iconByCommandType[firstCommandType] ?? null
      : null
  return (
    <Flex
      {...targetProps}
      cursor="pointer"
      onClick={makeHandleJumpToStep(index)}
      backgroundColor={COLORS.white}
      fontSize="9px"
      borderRadius="4px"
      border={`${COLORS.blueEnabled} 1px solid`}
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
            padding={SPACING.spacing1}
            gridGap={SPACING.spacing2}
            alignItems={ALIGN_CENTER}
          >
            {!isAggregatedTick && iconName != null ? (
              <Icon name={iconName} size={SPACING.spacingM} />
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
