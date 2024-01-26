import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { ToggleButton } from '../../atoms/buttons'
import { getConfig, toggleConfigValue } from '../../redux/config'

import type { Dispatch, State } from '../../redux/types'

export function PreventRobotCaching(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const displayUnavailRobots = useSelector((state: State) => {
    return getConfig(state)?.discovery.disableCache ?? false
  })
  const dispatch = useDispatch<Dispatch>()

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing8}
          id="AdvancedSettings_unavailableRobots"
        >
          {t('prevent_robot_caching')}
        </StyledText>
        <StyledText as="p">
          <Trans
            t={t}
            i18nKey="prevent_robot_caching_description"
            components={{
              strong: (
                <StyledText
                  as="span"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                />
              ),
            }}
          />
        </StyledText>
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
