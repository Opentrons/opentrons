import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  SPACING,
  COLORS,
  Btn,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_START,
  Icon,
  ALIGN_CENTER,
  TYPOGRAPHY,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { RobotSystemVersionModal } from './RobotSystemVersionModal'
import { getShellUpdateState } from '../../../redux/shell'

import type { SettingOption } from '../../../pages/OnDeviceDisplay/RobotSettingsDashboard/RobotSettingButton'

const GITHUB_URL = 'https://github.com/Opentrons/opentrons'

interface RobotSystemVersionProps {
  currentVersion: string
  isUpdateAvailable: boolean
  setCurrentOption: (currentOption: SettingOption | null) => void
}

export function RobotSystemVersion({
  currentVersion,
  isUpdateAvailable,
  setCurrentOption,
}: RobotSystemVersionProps): JSX.Element {
  const { t, i18n } = useTranslation([
    'device_settings',
    'shared',
    'device_details',
    'app_settings',
  ])
  const [showModal, setShowModal] = React.useState<boolean>(isUpdateAvailable)
  const updateState = useSelector(getShellUpdateState)
  const version = updateState?.info?.version ?? ''
  const releaseNotes = updateState?.info?.releaseNotes ?? ''

  return (
    <>
      {showModal && (
        <RobotSystemVersionModal
          version={version}
          releaseNotes={releaseNotes}
          setShowModal={setShowModal}
        />
      )}
      <Flex flexDirection={DIRECTION_COLUMN} paddingY={SPACING.spacing32}>
        <Flex justifyContent={JUSTIFY_FLEX_START} alignItems={ALIGN_CENTER}>
          <Btn onClick={() => setCurrentOption(null)}>
            <Icon name="back" size="3rem" color={COLORS.darkBlack100} />
          </Btn>
          <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
            {t('robot_system_version')}
          </StyledText>
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          marginTop="3rem"
          gridGap={SPACING.spacing24}
        >
          {isUpdateAvailable ? (
            <Flex
              flexDirection={DIRECTION_ROW}
              padding={`${SPACING.spacing24} ${SPACING.spacing16}`}
              gridGap={SPACING.spacing16}
              borderRadius={BORDERS.borderRadiusSize3}
              alignItems={ALIGN_CENTER}
              backgroundColor={COLORS.warningBackgroundMed}
            >
              <Icon name="ot-alert" size="2rem" color={COLORS.warningEnabled} />
              <StyledText
                fontSize="1.375rem"
                lineHeight="1.875rem"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {i18n.format(t('app_settings:update_available'), 'capitalize')}
              </StyledText>
            </Flex>
          ) : null}
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
            <StyledText
              fontSize="1.5rem"
              lineHeight="2.0625rem"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
            >{`${t(
              'shared:view_latest_release_notes'
            )} ${GITHUB_URL}`}</StyledText>
            <Flex
              backgroundColor={COLORS.light2}
              flexDirection={DIRECTION_ROW}
              padding={SPACING.spacing24}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              borderRadius={BORDERS.borderRadiusSize3}
            >
              <StyledText
                fontSize="1.5rem"
                lineHeight="2.0625rem"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >{`${t('device_details:current_version')}:`}</StyledText>
              <StyledText
                fontSize="1.5rem"
                lineHeight="2.0625rem"
                fontWeight={TYPOGRAPHY.fontWeightRegular}
              >
                {currentVersion}
              </StyledText>
            </Flex>
          </Flex>
        </Flex>
        {isUpdateAvailable ? (
          <PrimaryButton
            paddingY={SPACING.spacing24}
            marginTop="7.8125rem"
            onClick={() => console.log('open update modal')}
          >
            <StyledText
              fontSize="1.5rem"
              lineHeight="1.375rem"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {t('app_settings:view_software_update')}
            </StyledText>
          </PrimaryButton>
        ) : null}
      </Flex>
    </>
  )
}
