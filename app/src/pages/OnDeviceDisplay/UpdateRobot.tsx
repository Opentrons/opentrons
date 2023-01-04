import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

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
import { getLocalRobot, UNREACHABLE } from '../../redux/discovery'
import { getBuildrootUpdateAvailable } from '../../redux/buildroot'
import { StyledText } from '../../atoms/text'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'

import type { Dispatch, State } from '../../redux/types'

// Note typography isn't used in this component since properties will be changed in hi-fi design
// currently most of them are hard-coded.
export function UpdateRobot(): JSX.Element {
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const isViewableRobot =
    localRobot != null && localRobot.status !== UNREACHABLE
  // For the ODD app, it is only allowed to update the robot-server version
  // if robotUpdatetype is downgrade or reinstall, the ODD app shows No update found screen
  const robotUpdateType = useSelector((state: State) => {
    return isViewableRobot
      ? getBuildrootUpdateAvailable(state, localRobot)
      : null
  })

  return (
    <Flex
      padding={`${String(SPACING.spacing5)} ${String(
        SPACING.spacingXXL
      )} ${String(SPACING.spacingXXL)}`}
    >
      {robotUpdateType === 'reinstall' || robotUpdateType === 'downgrade' ? (
        <NoUpdateFound />
      ) : (
        <CompleteUpdate robotName={robotName} />
      )}
      {/* <CheckUpdates /> */}
      {/* <UpdateSoftware /> */}
      {/* <NoUpdateFound /> */}
      {/* <CompleteUpdate robotName={robotName} /> */}
      {/* <ErrorUpdateSoftware /> */}
    </Flex>
  )
}

// This might be a molecules component since WiFi connection part has the same screen
const CheckUpdates = (): JSX.Element => {
  const { t } = useTranslation('device_settings')
  return (
    <Flex
      backgroundColor={COLORS.darkGreyDisabled}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacingXXL}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
      height="33rem"
    >
      <Icon
        name="ot-spinner"
        size="4.375rem"
        spin
        color={COLORS.darkGreyEnabled}
      />
      <StyledText
        fontSize="2rem"
        lineHeight="2.75rem"
        fontWeight="700"
        colors={COLORS.black}
      >
        {t('checking_for_updates')}
      </StyledText>
    </Flex>
  )
}

const UpdateSoftware = (): JSX.Element => {
  const { t } = useTranslation('device_settings')
  return (
    <Flex
      backgroundColor={COLORS.darkGreyDisabled}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
      height="33rem"
    >
      <StyledText
        fontSize="2rem"
        lineHeight="2.75rem"
        fontWeight="700"
        colors={COLORS.black}
      >
        {t('update_found')}
      </StyledText>
      <StyledText
        fontSize="1.5rem"
        lineHeight="2.0625rem"
        fontWeight="400"
        marginBottom={SPACING.spacing5}
      >
        {t('downloading_software')}
      </StyledText>
      {'loading bar here'}
    </Flex>
  )
}

const NoUpdateFound = (): JSX.Element => {
  const { t } = useTranslation(['device_settings'])
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
          {t('next')}
        </StyledText>
      </PrimaryButton>
    </Flex>
  )
}

interface CompleteUpdateProps {
  robotName: string
}
const CompleteUpdate = ({ robotName }: CompleteUpdateProps): JSX.Element => {
  const { t } = useTranslation(['device_settings', 'robot_controls'])
  const dispatch = useDispatch<Dispatch>()

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

const ErrorUpdateSoftware = (): JSX.Element => {
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
            {t('next')}
          </StyledText>
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}
