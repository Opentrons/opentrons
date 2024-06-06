import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  PrimaryButton,
  SPACING,
  TYPOGRAPHY,
  StyledText,
} from '@opentrons/components'

import { SmallButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'
import { InterventionModal as InterventionModalMolecule } from '../../molecules/InterventionModal'
import { getIsOnDevice } from '../../redux/config'
import { PauseInterventionContent } from './PauseInterventionContent'
import { MoveLabwareInterventionContent } from './MoveLabwareInterventionContent'

import type { RunCommandSummary, RunData } from '@opentrons/api-client'
import type { IconName } from '@opentrons/components'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import { useRobotType } from '../Devices/hooks'

const LEARN_ABOUT_MANUAL_STEPS_URL =
  'https://support.opentrons.com/s/article/Manual-protocol-steps'

const CONTENT_STYLE = {
  display: DISPLAY_FLEX,
  flexDirection: DIRECTION_COLUMN,
  alignItems: ALIGN_FLEX_START,
  gridGap: SPACING.spacing24,
  padding: SPACING.spacing32,
  borderRadius: BORDERS.borderRadius8,
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

  const robotType = useRobotType(robotName)
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
          {...{ command, run, analysis, robotType }}
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
      border={`${BORDERS.borderRadius8} ${BORDERS.styleSolid} ${COLORS.blue50}`}
      modalSize="large"
      header={{
        backgroundColor: COLORS.blue50,
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
    <InterventionModalMolecule
      iconHeading={<StyledText as="h1">{headerTitle}</StyledText>}
      iconName={iconName}
      type="intervention-required"
    >
      <Box {...CONTENT_STYLE}>
        {childContent}
        <Box {...FOOTER_STYLE}>
          <Link
            css={TYPOGRAPHY.darkLinkH4SemiBold}
            href={LEARN_ABOUT_MANUAL_STEPS_URL}
            external
          >
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
    </InterventionModalMolecule>
  )
}
