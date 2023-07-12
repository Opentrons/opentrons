import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Box,
  Flex,
  COLORS,
  SPACING,
  POSITION_FIXED,
  POSITION_ABSOLUTE,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  POSITION_RELATIVE,
  OVERFLOW_AUTO,
  POSITION_STICKY,
  BORDERS,
  DISPLAY_FLEX,
  DIRECTION_COLUMN,
  ALIGN_FLEX_START,
  TYPOGRAPHY,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  Icon,
  PrimaryButton,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { PauseInterventionContent } from './PauseInterventionContent'
import { MoveLabwareInterventionContent } from './MoveLabwareInterventionContent'

import type { RunCommandSummary, RunData } from '@opentrons/api-client'
import { CompletedProtocolAnalysis } from '@opentrons/shared-data'

const BASE_STYLE = {
  position: POSITION_ABSOLUTE,
  alignItems: ALIGN_CENTER,
  justifyContent: JUSTIFY_CENTER,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: '100%',
  height: '100%',
} as const

const MODAL_STYLE = {
  backgroundColor: COLORS.white,
  position: POSITION_RELATIVE,
  overflowY: OVERFLOW_AUTO,
  maxHeight: '100%',
  width: '47rem',
  margin: SPACING.spacing24,
  border: `6px ${String(BORDERS.styleSolid)} ${String(COLORS.blueEnabled)}`,
  borderRadius: BORDERS.radiusSoftCorners,
  boxShadow: BORDERS.smallDropShadow,
} as const

const HEADER_STYLE = {
  display: DISPLAY_FLEX,
  flexDirection: DIRECTION_COLUMN,
  alignItems: ALIGN_FLEX_START,
  justifyContent: JUSTIFY_CENTER,
  padding: `0px ${SPACING.spacing32}`,
  color: COLORS.white,
  backgroundColor: COLORS.blueEnabled,
  position: POSITION_STICKY,
  top: 0,
  height: '3.25rem',
} as const

const CONTENT_STYLE = {
  display: DISPLAY_FLEX,
  flexDirection: DIRECTION_COLUMN,
  alignItems: ALIGN_FLEX_START,
  gridGap: SPACING.spacing24,
  padding: `${SPACING.spacing32}`,
  borderRadius: `0px 0px ${String(BORDERS.radiusSoftCorners)} ${String(
    BORDERS.radiusSoftCorners
  )}`,
} as const

const FOOTER_STYLE = {
  display: DISPLAY_FLEX,
  width: '100%',
  justifyContent: JUSTIFY_SPACE_BETWEEN,
} as const

export interface InterventionModalProps {
  robotName: string
  onResume: () => void
  command: RunCommandSummary
  run: RunData
  analysis: CompletedProtocolAnalysis | null
}

export function InterventionModal({
  robotName,
  onResume,
  command,
  run,
  analysis,
}: InterventionModalProps): JSX.Element {
  const { t } = useTranslation(['protocol_command_text', 'protocol_info'])

  const childContent = React.useMemo(() => {
    if (
      command.commandType === 'waitForResume' ||
      command.commandType === 'pause' // legacy pause command
    ) {
      return (
        <PauseInterventionContent
          startedAt={command.startedAt ?? null}
          message={command.params.message ?? null}
        />
      )
    } else if (command.commandType === 'moveLabware') {
      return <MoveLabwareInterventionContent {...{ command, run, analysis }} />
    } else {
      return null
    }
  }, [
    command.id,
    analysis?.status,
    run.labware.map(l => l.id).join(),
    run.modules.map(m => m.id).join(),
  ])

  return (
    <Flex
      position={POSITION_FIXED}
      left="0"
      right="0"
      top="0"
      bottom="0"
      zIndex="1"
      backgroundColor={COLORS.backgroundOverlay}
      cursor="default"
    >
      <Flex {...BASE_STYLE} zIndex={10}>
        <Box
          {...MODAL_STYLE}
          onClick={e => {
            e.stopPropagation()
          }}
        >
          <Box {...HEADER_STYLE}>
            <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {t('perform_manual_step', { robot_name: robotName })}
            </StyledText>
          </Box>
          <Box {...CONTENT_STYLE}>
            {childContent}
            <Box {...FOOTER_STYLE}>
              <StyledText>
                <Link css={TYPOGRAPHY.darkLinkLabelSemiBold} href="" external>
                  {t('protocol_info:manual_steps_learn_more')}
                  <Icon
                    name="open-in-new"
                    marginLeft={SPACING.spacing4}
                    size="0.5rem"
                  />
                </Link>
              </StyledText>
              <PrimaryButton onClick={onResume}>
                {t('confirm_and_resume')}
              </PrimaryButton>
            </Box>
          </Box>
        </Box>
      </Flex>
    </Flex>
  )
}
