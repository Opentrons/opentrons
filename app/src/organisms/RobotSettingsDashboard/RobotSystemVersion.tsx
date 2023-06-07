import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { MediumButton } from '../../atoms/buttons'
import { RobotSystemVersionModal } from './RobotSystemVersionModal'
import { getShellUpdateState } from '../../redux/shell'

import type { SettingOption } from '../../pages/OnDeviceDisplay/RobotSettingsDashboard/RobotSettingButton'

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
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        paddingTop={SPACING.spacing32}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Flex
            justifyContent={JUSTIFY_FLEX_START}
            alignItems={ALIGN_CENTER}
            gridGap={SPACING.spacing16}
          >
            <Btn
              onClick={() => setCurrentOption(null)}
              data-testid="RobotSystemVersion_back_button"
            >
              <Icon name="back" size="3rem" color={COLORS.darkBlack100} />
            </Btn>
            <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
              {t('robot_system_version')}
            </StyledText>
          </Flex>
          {isUpdateAvailable ? (
            <Flex
              flexDirection={DIRECTION_ROW}
              padding={`${SPACING.spacing12} ${SPACING.spacing16}`}
              gridGap={SPACING.spacing16}
              borderRadius={BORDERS.borderRadiusSize3}
              alignItems={ALIGN_CENTER}
              backgroundColor={COLORS.yellow3}
            >
              <Icon name="ot-alert" size="1.75rem" color={COLORS.yellow2} />
              <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                {i18n.format(t('app_settings:update_available'), 'capitalize')}
              </StyledText>
            </Flex>
          ) : null}
        </Flex>
        <Flex gridGap="16rem" flexDirection={DIRECTION_COLUMN}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
            <StyledText as="p">{`${t(
              'view_latest_release_notes_at'
            )} ${GITHUB_URL}`}</StyledText>
            <Flex
              backgroundColor={COLORS.light1}
              flexDirection={DIRECTION_ROW}
              padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              borderRadius={BORDERS.borderRadiusSize3}
            >
              <StyledText
                as="p"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >{`${t('device_details:current_version')}:`}</StyledText>
              <StyledText as="p">{currentVersion}</StyledText>
            </Flex>
          </Flex>
          <Flex>
            {isUpdateAvailable ? (
              <MediumButton
                flex="1"
                buttonText={t('view_update')}
                onClick={() => setShowModal(true)}
              />
            ) : null}
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
