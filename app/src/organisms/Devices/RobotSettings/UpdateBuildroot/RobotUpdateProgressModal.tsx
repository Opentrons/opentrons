import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { css } from 'styled-components'

import {
  Flex,
  Icon,
  NewPrimaryBtn,
  NewSecondaryBtn,
  JUSTIFY_FLEX_END,
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  SPACING,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { LegacyModal } from '../../../../molecules/LegacyModal'
import { ProgressBar } from '../../../../atoms/ProgressBar'
import { FOOTER_BUTTON_STYLE } from './UpdateRobotModal'
import {
  clearRobotUpdateSession,
  startRobotUpdate,
} from '../../../../redux/robot-update'
import successIcon from '../../../../assets/images/icon_success.png'

import type { Dispatch } from '../../../../redux/types'
import type { UpdateStep } from '.'
import type { RobotUpdateAction } from '../../../../redux/robot-update/types'

interface SuccessOrErrorProps {
  errorMessage?: string | null
}

function SuccessOrError({ errorMessage }: SuccessOrErrorProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const IMAGE_ALT = 'Welcome screen background image'
  let renderedImg: JSX.Element
  if (!errorMessage)
    renderedImg = (
      <img alt={IMAGE_ALT} src={successIcon} height="50%" width="50%" />
    )
  else
    renderedImg = (
      <Icon name="alert-circle" size="25%" color={COLORS.errorEnabled} />
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

interface RobotUpdateProgressFooterProps {
  robotName: string
  errorMessage?: string | null
  closeUpdateBuildroot?: () => void
}

function RobotUpdateProgressFooter({
  robotName,
  errorMessage,
  closeUpdateBuildroot,
}: RobotUpdateProgressFooterProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  // TODO(jh, 08-30-2023: add reinstall logic for zip file installation)
  const installUpdate = React.useCallback(() => {
    dispatch(clearRobotUpdateSession())
    dispatch(startRobotUpdate(robotName))
  }, [robotName])

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_FLEX_END}>
      {errorMessage && (
        <NewSecondaryBtn
          onClick={installUpdate}
          marginRight={SPACING.spacing8}
          css={FOOTER_BUTTON_STYLE}
        >
          {t('try_again')}
        </NewSecondaryBtn>
      )}
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

interface RobotUpdateProgressModalProps {
  robotName: string
  updateStep: UpdateStep
  stepProgress?: number | null
  error?: string | null
  closeUpdateBuildroot?: () => void
}

export function RobotUpdateProgressModal({
  robotName,
  updateStep,
  stepProgress,
  error,
  closeUpdateBuildroot,
}: RobotUpdateProgressModalProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch()
  const progressPercent = React.useRef<number>(0)
  const [previousUpdateStep, setPreviousUpdateStep] = React.useState<
    string | null
  >(null)
  const completeRobotUpdateHandler = (): RobotUpdateAction => {
    if (closeUpdateBuildroot != null) closeUpdateBuildroot()
    return dispatch(clearRobotUpdateSession())
  }

  let modalBodyText = t('downloading_update')
  if (updateStep === 'install') {
    modalBodyText = t('installing_update')
  } else if (updateStep === 'restart') {
    modalBodyText = t('restarting_robot')
  }

  // Account for update methods that do not require download & decreasing percent oddities.
  React.useEffect(() => {
    const explicitStepProgress = stepProgress || 0
    if (previousUpdateStep === null) {
      if (updateStep === 'install')
        progressPercent.current = Math.max(
          progressPercent.current,
          explicitStepProgress
        )
      else if (updateStep === 'download') {
        progressPercent.current = Math.max(
          progressPercent.current,
          Math.floor(explicitStepProgress / 2)
        )
        if (progressPercent.current === 50) setPreviousUpdateStep('download')
      } else progressPercent.current = 100
    } else {
      progressPercent.current = Math.max(
        progressPercent.current,
        50 + Math.floor(explicitStepProgress / 2)
      )
    }
  }, [updateStep, stepProgress, previousUpdateStep])

  const completedUpdating = error || updateStep === 'finished'

  const UPDATE_PROGRESS_BAR_STYLE = css`
    margin-top: ${SPACING.spacing24};
    margin-bottom: ${SPACING.spacing24};
    border-radius: ${BORDERS.borderRadiusSize3};
    background: ${COLORS.medGreyEnabled};
  `
  const dontTurnOffMessage = css`
    color: ${COLORS.darkGreyEnabled};
  `

  return (
    <LegacyModal
      title={`${t('updating')} ${robotName}`}
      width="40rem"
      onClose={completedUpdating ? completeRobotUpdateHandler : undefined}
      footer={
        completedUpdating ? (
          <RobotUpdateProgressFooter
            robotName={robotName}
            errorMessage={error}
            closeUpdateBuildroot={completeRobotUpdateHandler}
          />
        ) : null
      }
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        padding={SPACING.spacing48}
      >
        {completedUpdating ? (
          <SuccessOrError errorMessage={error} />
        ) : (
          <>
            <StyledText>{modalBodyText}</StyledText>
            <ProgressBar
              percentComplete={progressPercent.current}
              outerStyles={UPDATE_PROGRESS_BAR_STYLE}
            />
            <StyledText css={dontTurnOffMessage}>
              {t('do_not_turn_off')}
            </StyledText>
          </>
        )}
      </Flex>
    </LegacyModal>
  )
}
