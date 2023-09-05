import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

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

import { SmallButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { Modal } from '../../molecules/Modal'
import { getIsOnDevice } from '../../redux/config'
import { PauseInterventionContent } from './PauseInterventionContent'
import { MoveLabwareInterventionContent } from './MoveLabwareInterventionContent'

import type { RunCommandSummary, RunData } from '@opentrons/api-client'
import type { IconName } from '@opentrons/components'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

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
  border: `6px ${BORDERS.styleSolid} ${COLORS.blueEnabled}`,
  borderRadius: BORDERS.radiusSoftCorners,
  boxShadow: BORDERS.smallDropShadow,
} as const

const HEADER_STYLE = {
  alignItems: ALIGN_CENTER,
  gridGap: SPACING.spacing12,
  padding: `${SPACING.spacing20} ${SPACING.spacing32}`,
  color: COLORS.white,
  backgroundColor: COLORS.blueEnabled,
  position: POSITION_STICKY,
  top: 0,
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
  alignItems: ALIGN_CENTER,
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
  const isOnDevice = useSelector(getIsOnDevice)

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
      return (
        <MoveLabwareInterventionContent
          {...{ command, run, analysis }}
          isOnDevice={isOnDevice}
        />
      )
    } else {
      return null
    }
  }, [
    command.id,
    analysis?.status,
    run.labware.map(l => l.id).join(),
    run.modules.map(m => m.id).join(),
  ])

  let iconName: IconName | null = null
  let headerTitle = ''
  let headerTitleOnDevice = ''
  if (
    command.commandType === 'waitForResume' ||
    command.commandType === 'pause' // legacy pause command
  ) {
    iconName = 'pause-circle'
    headerTitle = t('pause_on', { robot_name: robotName })
    headerTitleOnDevice = t('pause')
  } else if (command.commandType === 'moveLabware') {
    iconName = 'move-xy-circle'
    headerTitle = t('move_labware_on', { robot_name: robotName })
    headerTitleOnDevice = t('move_labware')
  }

  // TODO(bh, 2023-7-18): this is a one-off modal implementation for desktop
  // reimplement when design system shares a modal component between desktop/ODD
  return isOnDevice ? (
    <Modal
      border={`8px ${BORDERS.styleSolid} ${COLORS.blueEnabled}`}
      modalSize="large"
      header={{
        backgroundColor: COLORS.blueEnabled,
        color: COLORS.white,
        iconColor: COLORS.white,
        iconName: iconName ?? undefined,
        title: headerTitleOnDevice,
      }}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        paddingTop={SPACING.spacing32}
        width="100%"
      >
        {childContent}
        <SmallButton
          buttonText={t('confirm_and_resume')}
          onClick={onResume}
          buttonType="secondary"
        />
      </Flex>
    </Modal>
  ) : (
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
          <Flex {...HEADER_STYLE}>
            {iconName != null ? (
              <Icon name={iconName} size={SPACING.spacing32} />
            ) : null}
            <StyledText as="h1">{headerTitle}</StyledText>
          </Flex>
          <Box {...CONTENT_STYLE}>
            {childContent}
            <Box {...FOOTER_STYLE}>
              <Link css={TYPOGRAPHY.darkLinkH4SemiBold} href="" external>
                {t('protocol_info:manual_steps_learn_more')}
                <Icon
                  name="open-in-new"
                  marginLeft={SPACING.spacing4}
                  size="0.5rem"
                />
              </Link>
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
