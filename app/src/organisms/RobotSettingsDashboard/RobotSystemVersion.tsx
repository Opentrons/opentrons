import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { MediumButton } from '../../atoms/buttons'
import { ChildNavigation } from '../../organisms/ChildNavigation'
import { RobotSystemVersionModal } from './RobotSystemVersionModal'

import type { RobotUpdateInfo } from '../../redux/robot-update/types'
import type { SetSettingOption } from '../../pages/OnDeviceDisplay/RobotSettingsDashboard'

const GITHUB_URL = 'https://github.com/Opentrons/opentrons/releases'

interface RobotSystemVersionProps {
  currentVersion: string
  isUpdateAvailable: boolean
  robotUpdateInfo: RobotUpdateInfo | null
  setCurrentOption: SetSettingOption
}

export function RobotSystemVersion({
  currentVersion,
  isUpdateAvailable,
  robotUpdateInfo,
  setCurrentOption,
}: RobotSystemVersionProps): JSX.Element {
  const { t, i18n } = useTranslation([
    'device_settings',
    'shared',
    'device_details',
    'app_settings',
  ])
  const [showModal, setShowModal] = React.useState<boolean>(isUpdateAvailable)

  return (
    <>
      {showModal && (
        <RobotSystemVersionModal
          version={robotUpdateInfo?.version ?? ''}
          releaseNotes={robotUpdateInfo?.releaseNotes ?? ''}
          setShowModal={setShowModal}
        />
      )}
      <Flex flexDirection={DIRECTION_COLUMN}>
        <ChildNavigation
          header={t('robot_system_version')}
          inlineNotification={
            isUpdateAvailable
              ? {
                  heading: i18n.format(
                    t('app_settings:update_available'),
                    'capitalize'
                  ),
                  type: 'alert',
                }
              : undefined
          }
          onClickBack={() => setCurrentOption(null)}
        />
        <Flex
          gridGap="16rem"
          flexDirection={DIRECTION_COLUMN}
          paddingX={SPACING.spacing40}
          marginTop="7.75rem"
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
            <StyledText as="p">
              {t('view_latest_release_notes_at', { url: GITHUB_URL })}
            </StyledText>
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
              >{`${t('device_details:current_version')}`}</StyledText>
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
