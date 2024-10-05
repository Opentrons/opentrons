import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { RobotSettingButton } from './RobotSettingButton'
import { OnOffToggle } from './OnOffToggle'
import {
  getAnalyticsOptedIn,
  toggleAnalyticsOptedIn,
} from '/app/redux/analytics'

import type { Dispatch } from '/app/redux/types'
import type { SetSettingOption } from './types'

interface PrivacyProps {
  robotName: string
  setCurrentOption: SetSettingOption
}

export function Privacy({
  robotName,
  setCurrentOption,
}: PrivacyProps): JSX.Element {
  const { t } = useTranslation(['app_settings', 'branded'])
  const dispatch = useDispatch<Dispatch>()

  const appAnalyticsOptedIn = useSelector(getAnalyticsOptedIn)

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <ChildNavigation
        header={t('app_settings:privacy')}
        onClickBack={() => {
          setCurrentOption(null)
        }}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing24}
        paddingX={SPACING.spacing40}
        marginTop="7.75rem"
      >
        <LegacyStyledText
          fontSize={TYPOGRAPHY.fontSize28}
          lineHeight={TYPOGRAPHY.lineHeight36}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
        >
          {t('branded:opentrons_cares_about_privacy')}
        </LegacyStyledText>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <RobotSettingButton
            settingName={t('share_display_usage')}
            settingInfo={t('branded:share_display_usage_description')}
            dataTestId="RobotSettingButton_share_app_analytics"
            rightElement={<OnOffToggle isOn={appAnalyticsOptedIn} />}
            onClick={() => dispatch(toggleAnalyticsOptedIn())}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
