import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ToggleButton } from '/app/atoms/buttons'
import { getConfig, toggleConfigValue } from '/app/redux/config'

import type { Dispatch, State } from '/app/redux/types'

export function PreventRobotCaching(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const displayUnavailRobots = useSelector((state: State) => {
    return getConfig(state)?.discovery.disableCache ?? false
  })
  const dispatch = useDispatch<Dispatch>()

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <LegacyStyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing8}
          id="AdvancedSettings_unavailableRobots"
        >
          {t('prevent_robot_caching')}
        </LegacyStyledText>
        <LegacyStyledText as="p">
          <Trans
            t={t}
            i18nKey="prevent_robot_caching_description"
            components={{
              strong: (
                <LegacyStyledText
                  as="span"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                />
              ),
            }}
          />
        </LegacyStyledText>
      </Box>
      <ToggleButton
        label="display_unavailable_robots"
        toggledOn={!displayUnavailRobots}
        onClick={() => dispatch(toggleConfigValue('discovery.disableCache'))}
        id="AdvancedSettings_unavailableRobotsToggleButton"
      />
    </Flex>
  )
}
