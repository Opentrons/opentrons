import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import capitalize from 'lodash/capitalize'

import {
  Flex,
  SPACING,
  COLORS,
  Icon,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  DIRECTION_ROW,
} from '@opentrons/components'

import { restartRobot } from '../../redux/robot-admin'
import { getLocalRobot } from '../../redux/discovery'
import {
  // getBuildrootUpdateAvailable,
  getBuildrootDownloadProgress,
  getBuildrootDownloadError,
  getBuildrootSession,
  startBuildrootUpdate,
  getBuildrootUpdateDisplayInfo,
} from '../../redux/buildroot'
import { StyledText } from '../../atoms/text'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'
import { CheckUpdates } from '../../organisms/UpdateRobotSoftware/CheckUpdates'
import { UpdateSoftware } from '../../organisms/UpdateRobotSoftware/UpdateSoftware'

import type { Dispatch, State } from '../../redux/types'

// Note typography isn't used in this component since properties will be changed in hi-fi design
// currently most of them are hard-coded.
export function UpdateRobot(): JSX.Element {
  const { t } = useTranslation('device_settings')
  const [
    isShowCheckingUpdates,
    setIsShowCheckingUpdates,
  ] = React.useState<boolean>(true)
  const [isDownloading, setIsDownloading] = React.useState<boolean>(false)
  const [isValidating, setIsValidating] = React.useState<boolean>(false)
  const [isInstalling, setIsInstalling] = React.useState<boolean>(false)
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'

  const { autoUpdateAction } = useSelector((state: State) => {
    return getBuildrootUpdateDisplayInfo(state, robotName)
  })

  console.log('autoUpdateAction', autoUpdateAction)

  const downloadProgress = useSelector(getBuildrootDownloadProgress)
  const downloadError =
    useSelector(getBuildrootDownloadError) != null ? t('download_error') : null
  const session = useSelector(getBuildrootSession)
  const { step, error: sessionError } = session ?? { step: null, error: null }
  const dispatch = useDispatch<Dispatch>()

  console.log('step', step)
  console.log('stage', session?.stage)
  console.log('downloadProgress', downloadProgress)
  console.log('downloadError', downloadError)
  console.log('sessionError', sessionError)

  React.useEffect(() => {
    autoUpdateAction !== 'upgrade' && setIsShowCheckingUpdates(false)
    if (autoUpdateAction === 'upgrade') {
      setIsShowCheckingUpdates(false)
      setIsDownloading(true)
    } else {
      setIsShowCheckingUpdates(false)
    }
  }, [autoUpdateAction])

  React.useEffect(() => {
    if (isDownloading) {
      dispatch(startBuildrootUpdate(robotName))
    }
  }, [isDownloading, dispatch, robotName])

  React.useEffect(() => {
    if (step === 'processFile' || step === 'commitUpdate') {
      if (
        session?.stage === 'awaiting-file' ||
        session?.stage === 'validating'
      ) {
        setIsValidating(true)
      } else {
        setIsInstalling(true)
      }
    }
  }, [step, session])

  return (
    <Flex
      padding={`${String(SPACING.spacing5)} ${String(
        SPACING.spacingXXL
      )} ${String(SPACING.spacingXXL)}`}
    >
      {isShowCheckingUpdates ? <CheckUpdates /> : null}
      {/* No need to update software */}
      {autoUpdateAction !== 'upgrade' ? <NoUpdateFound /> : null}

      {/* Download software start */}
      {isDownloading ? (
        <UpdateSoftware
          downloading
          processProgress={downloadProgress != null ? downloadProgress : 100}
        />
      ) : null}
      {downloadError != null ? (
        <ErrorUpdateSoftware errorMessage={downloadError} />
      ) : null}
      {/* Download software end */}

      {/* Validating software start */}
      {isValidating ? (
        <UpdateSoftware
          validating
          processProgress={session?.progress ? session.progress : 0}
        />
      ) : null}
      {/* Validating software end */}

      {/* Installing software start */}
      {isInstalling ? (
        <UpdateSoftware
          processProgress={session?.progress ? session.progress : 0}
        />
      ) : null}
      {(step === 'processFile' || step === 'commitUpdate') &&
      sessionError != null ? (
        <ErrorUpdateSoftware errorMessage={sessionError} />
      ) : null}
      {/* Installing software end */}

      {step === 'finished' ? (
        <CompleteUpdate robotName={robotName} dispatch={dispatch} />
      ) : null}
    </Flex>
  )
}

const NoUpdateFound = (): JSX.Element => {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  return (
    <Flex flexDirection={DIRECTION_COLUMN} width="100%">
      <Flex
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.successBackgroundMed}
        height="26.625rem"
        gridGap={SPACING.spacingXXL}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        <Icon
          name="check-circle"
          size="4.375rem"
          color={COLORS.successEnabled}
        />
        <StyledText
          fontSize="2rem"
          lineHeight="2.75rem"
          fontWeight="700"
          color={COLORS.black}
        >
          {t('software_is_up_to_date')}
        </StyledText>
      </Flex>
      <PrimaryButton
        marginTop={SPACING.spacing6}
        height="4.4375rem"
        onClick={() => history.push('/robot-settings/rename-robot')}
      >
        <StyledText fontSize="1.5rem" lineHeight="1.375rem" fontWeight="500">
          {t('shared:next')}
        </StyledText>
      </PrimaryButton>
    </Flex>
  )
}

interface CompleteUpdateProps {
  robotName: string
  dispatch: Dispatch
}
const CompleteUpdate = ({
  robotName,
  dispatch,
}: CompleteUpdateProps): JSX.Element => {
  const { t } = useTranslation(['device_settings', 'robot_controls'])

  const handleRestartRobot: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    dispatch(restartRobot(robotName))
  }
  return (
    <Flex flexDirection={DIRECTION_COLUMN} width="100%">
      <Flex
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.darkGreyDisabled}
        height="26.625rem"
        gridGap={SPACING.spacingXXL}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        <StyledText
          fontSize="2rem"
          lineHeight="2.75rem"
          fontWeight="700"
          color={COLORS.black}
        >
          {t('update_complete')}
        </StyledText>
        {/* pregoress bar */}
      </Flex>
      <PrimaryButton
        marginTop={SPACING.spacing6}
        height="4.4375rem"
        onClick={handleRestartRobot}
      >
        <StyledText fontSize="1.5rem" lineHeight="1.375rem" fontWeight="500">
          {t('robot_controls:restart_label')}
        </StyledText>
      </PrimaryButton>
    </Flex>
  )
}

interface ErrorUpdateSoftwareProps {
  errorMessage: string
}
const ErrorUpdateSoftware = ({
  errorMessage,
}: ErrorUpdateSoftwareProps): JSX.Element => {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  return (
    <Flex flexDirection={DIRECTION_COLUMN} width="100%">
      <Flex
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.errorBackgroundMed}
        height="26.625rem"
        gridGap={SPACING.spacingXXL}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        <Icon name="ot-alert" size="4.375rem" color={COLORS.errorEnabled} />
        <StyledText
          fontSize="2rem"
          lineHeight="2.75rem"
          fontWeight="700"
          color={COLORS.black}
        >
          {t('software_update_error')}
        </StyledText>
        {/* ToDo add error */}
        {errorMessage}
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        marginTop={SPACING.spacing6}
        gridGap="0.75rem"
      >
        <SecondaryButton
          height="4.4375rem"
          onClick={() => history.push('/robot-settings/rename-robot')}
          width="100%"
        >
          <StyledText fontSize="1.5rem" lineHeight="1.375rem" fontWeight="500">
            {t('proceed_without_updating')}
          </StyledText>
        </SecondaryButton>
        <PrimaryButton height="4.4375rem" width="100%">
          <StyledText fontSize="1.5rem" lineHeight="1.375rem" fontWeight="500">
            {capitalize(t('shared:try_again'))}
          </StyledText>
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}
