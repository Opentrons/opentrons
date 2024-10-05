import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

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
  JUSTIFY_CENTER,
  Link,
  PrimaryButton,
  SPACING,
  TYPOGRAPHY,
  LegacyStyledText,
  RESPONSIVENESS,
} from '@opentrons/components'
import {
  RUN_STATUS_FAILED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { InterventionModal as InterventionModalMolecule } from '/app/molecules/InterventionModal'
import { getIsOnDevice } from '/app/redux/config'
import { PauseInterventionContent } from './PauseInterventionContent'
import { MoveLabwareInterventionContent } from './MoveLabwareInterventionContent'
import { isInterventionCommand } from './utils'
import { useRobotType } from '/app/redux-resources/robots'
import { InlineNotification } from '/app/atoms/InlineNotification'

import type { ReactNode } from 'react'
import type { IconName } from '@opentrons/components'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type {
  RunCommandSummary,
  RunData,
  RunStatus,
} from '@opentrons/api-client'

const TERMINAL_RUN_STATUSES: RunStatus[] = [
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_SUCCEEDED,
]

export interface UseInterventionModalProps {
  runData: RunData | null
  lastRunCommand: RunCommandSummary | null
  runStatus: RunStatus | null
  robotName: string | null
  analysis: CompletedProtocolAnalysis | null
  doorIsOpen: boolean
}

export type UseInterventionModalResult =
  | { showModal: false; modalProps: null }
  | { showModal: true; modalProps: Omit<InterventionModalProps, 'onResume'> }

// If showModal is true, modalProps are guaranteed not to be null.
export function useInterventionModal({
  runData,
  lastRunCommand,
  runStatus,
  robotName,
  analysis,
  doorIsOpen,
}: UseInterventionModalProps): UseInterventionModalResult {
  const isValidIntervention =
    lastRunCommand != null &&
    robotName != null &&
    isInterventionCommand(lastRunCommand) &&
    runData != null &&
    runStatus != null &&
    !TERMINAL_RUN_STATUSES.includes(runStatus)
  const { t } = useTranslation('run_details')

  if (!isValidIntervention) {
    return { showModal: false, modalProps: null }
  } else {
    return {
      showModal: true,
      modalProps: {
        command: lastRunCommand,
        run: runData,
        robotName,
        analysis,
        alternateFooterContent: doorIsOpen ? (
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
            width="100%"
            css={css`
              @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
                min-height: ${SPACING.spacing60};
              }
            `}
          >
            <InlineNotification
              type="neutral"
              heading={t('close_door_to_resume')}
            />
          </Flex>
        ) : undefined,
      },
    }
  }
}

export interface InterventionModalProps {
  robotName: string
  onResume: () => void
  command: RunCommandSummary
  run: RunData
  analysis: CompletedProtocolAnalysis | null
  alternateFooterContent?: ReactNode
}

export function InterventionModal({
  robotName,
  onResume,
  command,
  run,
  analysis,
  alternateFooterContent,
}: InterventionModalProps): JSX.Element {
  const { t } = useTranslation(['protocol_command_text', 'protocol_info'])
  const isOnDevice = useSelector(getIsOnDevice)

  const robotType = useRobotType(robotName)
  // TODO(jh 09-19-24): Make this into its own component.
  const childContent = (() => {
    switch (command.commandType) {
      case 'waitForResume':
      case 'pause': // legacy pause command
        return (
          <PauseInterventionContent
            startedAt={command.startedAt ?? null}
            message={command.params.message ?? null}
          />
        )
      case 'moveLabware':
        return (
          <MoveLabwareInterventionContent
            {...{ command, run, analysis, robotType }}
            isOnDevice={isOnDevice}
          />
        )
      default:
        console.warn(
          'Unhandled command passed to InterventionModal: ',
          command.commandType
        )
        return null
    }
  })()

  const { iconName, headerTitle, headerTitleOnDevice } = (() => {
    switch (command.commandType) {
      case 'waitForResume':
      case 'pause':
        return {
          iconName: 'pause-circle' as IconName,
          headerTitle: t('pause_on', { robot_name: robotName }),
          headerTitleOnDevice: t('pause'),
        }
      case 'moveLabware':
        return {
          iconName: 'move-xy-circle' as IconName,
          headerTitle: t('move_labware_on', { robot_name: robotName }),
          headerTitleOnDevice: t('move_labware'),
        }
      default:
        console.warn(
          'Unhandled command passed to InterventionModal: ',
          command.commandType
        )
        return {
          iconName: null,
          headerTitle: '',
          headerTitleOnDevice: '',
        }
    }
  })()

  // TODO(bh, 2023-7-18): this is a one-off modal implementation for desktop
  // reimplement when design system shares a modal component between desktop/ODD
  return isOnDevice ? (
    <OddModal
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
        {alternateFooterContent ?? (
          <SmallButton
            buttonText={t('confirm_and_resume')}
            onClick={onResume}
            buttonType="secondary"
          />
        )}
      </Flex>
    </OddModal>
  ) : (
    <InterventionModalMolecule
      iconHeading={<LegacyStyledText as="h1">{headerTitle}</LegacyStyledText>}
      iconName={iconName}
      type="intervention-required"
    >
      <Box {...CONTENT_STYLE}>
        {childContent}
        {alternateFooterContent ?? (
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
        )}
      </Box>
    </InterventionModalMolecule>
  )
}

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
