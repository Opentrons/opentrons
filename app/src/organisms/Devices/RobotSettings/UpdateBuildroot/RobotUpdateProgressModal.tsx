import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { css } from 'styled-components'

import {
  Flex,
  Icon,
  NewPrimaryBtn,
  JUSTIFY_FLEX_END,
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  SPACING,
  BORDERS,
} from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'

import { StyledText } from '../../../../atoms/text'
import { LegacyModal } from '../../../../molecules/LegacyModal'
import { ProgressBar } from '../../../../atoms/ProgressBar'
import { FOOTER_BUTTON_STYLE } from './UpdateRobotModal'
import {
  startRobotUpdate,
  clearRobotUpdateSession,
} from '../../../../redux/robot-update'
import { useRobotUpdateInfo } from './useRobotUpdateInfo'
import successIcon from '../../../../assets/images/icon_success.png'

import type { SetStatusBarCreateCommand } from '@opentrons/shared-data'
import type { RobotUpdateSession } from '../../../../redux/robot-update/types'
import type { UpdateStep } from './useRobotUpdateInfo'

const UPDATE_PROGRESS_BAR_STYLE = css`
  margin-top: ${SPACING.spacing24};
  margin-bottom: ${SPACING.spacing24};
  border-radius: ${BORDERS.borderRadiusSize3};
  background: ${COLORS.medGreyEnabled};
  width: 17.12rem;
`
const UPDATE_TEXT_STYLE = css`
  color: ${COLORS.darkGreyEnabled};
  font-size: 0.8rem;
`
const HIDDEN_CSS = css`
  position: fixed;
  clip: rect(1px 1px 1px 1px);
`

interface RobotUpdateProgressModalProps {
  robotName: string
  session: RobotUpdateSession | null
  closeUpdateBuildroot?: () => void
}

export function RobotUpdateProgressModal({
  robotName,
  session,
  closeUpdateBuildroot,
}: RobotUpdateProgressModalProps): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation('device_settings')
  const [showFileSelect, setShowFileSelect] = React.useState<boolean>(false)
  const installFromFileRef = React.useRef<HTMLInputElement>(null)

  const completeRobotUpdateHandler = (): void => {
    if (closeUpdateBuildroot != null) closeUpdateBuildroot()
  }
  const { error } = session || { error: null }
  const { updateStep, progressPercent } = useRobotUpdateInfo(session)
  useStatusBarAnimation(error != null)
  useCleanupRobotUpdateSessionOnDismount()

  const handleFileSelect: React.ChangeEventHandler<HTMLInputElement> = event => {
    const { files } = event.target
    if (files?.length === 1) {
      dispatch(startRobotUpdate(robotName, files[0].path))
    }
    setShowFileSelect(false)
  }
  React.useEffect(() => {
    if (showFileSelect && installFromFileRef.current)
      installFromFileRef.current.click()
  }, [showFileSelect])

  const hasStoppedUpdating = error || updateStep === 'finished'
  const letUserExitUpdate = useAllowExitIfUpdateStalled(
    updateStep,
    progressPercent
  )

  let modalBodyText = t('installing_update')
  let subProgressBarText = t('do_not_turn_off')
  if (updateStep === 'restart') modalBodyText = t('restarting_robot')
  if (updateStep === 'restart' && letUserExitUpdate) {
    subProgressBarText = t('restart_taking_too_long', { robotName })
  }

  return (
    <LegacyModal
      title={`${t('updating')} ${robotName}`}
      width="40rem"
      textAlign="center"
      onClose={
        hasStoppedUpdating || letUserExitUpdate
          ? completeRobotUpdateHandler
          : undefined
      }
      footer={
        hasStoppedUpdating ? (
          <RobotUpdateProgressFooter
            closeUpdateBuildroot={completeRobotUpdateHandler}
          />
        ) : null
      }
    >
      {hasStoppedUpdating ? (
        <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_CENTER}>
          <SuccessOrError errorMessage={error} />
        </Flex>
      ) : (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          padding={SPACING.spacing48}
        >
          <StyledText>{modalBodyText}</StyledText>
          <ProgressBar
            percentComplete={progressPercent}
            outerStyles={UPDATE_PROGRESS_BAR_STYLE}
          />
          <StyledText css={UPDATE_TEXT_STYLE}>
            {letUserExitUpdate && updateStep !== 'restart' ? (
              <>
                {t('problem_during_update')} {t('try_restarting_the_update')}
                {showFileSelect && (
                  <input
                    ref={installFromFileRef}
                    type="file"
                    onChange={handleFileSelect}
                    css={HIDDEN_CSS}
                  />
                )}
              </>
            ) : (
              subProgressBarText
            )}
          </StyledText>
        </Flex>
      )}
    </LegacyModal>
  )
}

interface RobotUpdateProgressFooterProps {
  closeUpdateBuildroot?: () => void
}

function RobotUpdateProgressFooter({
  closeUpdateBuildroot,
}: RobotUpdateProgressFooterProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_FLEX_END}>
      <NewPrimaryBtn
        onClick={closeUpdateBuildroot}
        marginRight={SPACING.spacing12}
        css={FOOTER_BUTTON_STYLE}
      >
        {t('exit')}
      </NewPrimaryBtn>
    </Flex>
  )
}

interface SuccessOrErrorProps {
  errorMessage?: string | null
}

function SuccessOrError({ errorMessage }: SuccessOrErrorProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const IMAGE_ALT = 'Welcome screen background image'
  let renderedImg: JSX.Element
  if (!errorMessage)
    renderedImg = (
      <img alt={IMAGE_ALT} src={successIcon} height="208px" width="250px" />
    )
  else
    renderedImg = (
      <Icon
        name="alert-circle"
        height="40px"
        color={COLORS.errorEnabled}
        margin={SPACING.spacing24}
      />
    )

  return (
    <>
      {renderedImg}
      <StyledText>
        {!errorMessage ? t('robot_update_success') : errorMessage}
      </StyledText>
    </>
  )
}

export const TIME_BEFORE_ALLOWING_EXIT_MS = 600000 // 10 mins

function useAllowExitIfUpdateStalled(
  updateStep: UpdateStep,
  progressPercent: number
): boolean {
  const [letUserExitUpdate, setLetUserExitUpdate] = React.useState<boolean>(
    false
  )
  const prevSeenUpdateProgress = React.useRef<number | null>(null)
  const exitTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    if (updateStep === 'initial' && prevSeenUpdateProgress.current !== null) {
      prevSeenUpdateProgress.current = null
    } else if (updateStep === 'finished' && exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current)
      setLetUserExitUpdate(false)
    } else if (progressPercent !== prevSeenUpdateProgress.current) {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current)
      exitTimeoutRef.current = setTimeout(() => {
        setLetUserExitUpdate(true)
      }, TIME_BEFORE_ALLOWING_EXIT_MS)

      prevSeenUpdateProgress.current = progressPercent
      setLetUserExitUpdate(false)
    }
  }, [progressPercent, updateStep])

  React.useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current)
    }
  }, [])

  return letUserExitUpdate
}

function useStatusBarAnimation(isError: boolean): void {
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const updatingCommand: SetStatusBarCreateCommand = {
    commandType: 'setStatusBar',
    params: { animation: 'updating' },
  }
  const idleCommand: SetStatusBarCreateCommand = {
    commandType: 'setStatusBar',
    params: { animation: 'idle' },
  }

  const startUpdatingAnimation = (): void => {
    createLiveCommand({
      command: updatingCommand,
      waitUntilComplete: false,
    }).catch((e: Error) =>
      console.warn(`cannot run status bar animation: ${e.message}`)
    )
  }

  const startIdleAnimationIfFailed = (): void => {
    if (isError) {
      createLiveCommand({
        command: idleCommand,
        waitUntilComplete: false,
      }).catch((e: Error) =>
        console.warn(`cannot run status bar animation: ${e.message}`)
      )
    }
  }

  React.useEffect(startUpdatingAnimation, [])
  React.useEffect(startIdleAnimationIfFailed, [isError])
}

function useCleanupRobotUpdateSessionOnDismount(): void {
  const dispatch = useDispatch()
  React.useEffect(() => {
    return () => {
      dispatch(clearRobotUpdateSession())
    }
  }, [])
}
