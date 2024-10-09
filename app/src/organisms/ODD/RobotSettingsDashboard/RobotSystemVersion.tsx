import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { MediumButton } from '/app/atoms/buttons'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { RobotSystemVersionModal } from './RobotSystemVersionModal'

import type { RobotUpdateInfo } from '/app/redux/robot-update/types'
import type { SetSettingOption } from './types'

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
    'branded',
  ])
  const [showModal, setShowModal] = useState<boolean>(isUpdateAvailable)

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
          onClickBack={() => {
            setCurrentOption(null)
          }}
        />
        <Flex
          gridGap="16rem"
          flexDirection={DIRECTION_COLUMN}
          paddingX={SPACING.spacing40}
          marginTop="7.75rem"
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
            <LegacyStyledText as="p">
              {t('branded:view_latest_release_notes_at', { url: GITHUB_URL })}
            </LegacyStyledText>
            <Flex
              backgroundColor={COLORS.grey35}
              flexDirection={DIRECTION_ROW}
              padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              borderRadius={BORDERS.borderRadius8}
            >
              <LegacyStyledText
                as="p"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >{`${t('device_details:current_version')}`}</LegacyStyledText>
              <LegacyStyledText as="p">{currentVersion}</LegacyStyledText>
            </Flex>
          </Flex>
          <Flex>
            {isUpdateAvailable ? (
              <MediumButton
                flex="1"
                buttonText={t('view_update')}
                onClick={() => {
                  setShowModal(true)
                }}
              />
            ) : null}
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
