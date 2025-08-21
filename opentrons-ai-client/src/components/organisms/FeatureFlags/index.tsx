import { useTranslation } from 'react-i18next'
import { useAtom } from 'jotai'
import map from 'lodash/map'

import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
  ToggleButton,
} from '@opentrons/components'

import { featureFlagsAtom } from '/ai-client/resources/atoms'

export const FeatureFlags = (): JSX.Element | null => {
  const [featureFlags, setFeatureFlags] = useAtom(featureFlagsAtom)
  const { t } = useTranslation('feature_flags')

  if (featureFlags.enablePrereleaseMode) {
    return (
      <Flex flexDirection={DIRECTION_COLUMN} gap={SPACING.spacing6}>
        {map(featureFlags, (flagValue, flagKey) => {
          return (
            <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} key={flagKey}>
              <StyledText> {t(flagKey)} </StyledText>
              <ToggleButton
                label={t(flagKey)}
                toggledOn={flagValue}
                onClick={() => {
                  setFeatureFlags({ [flagKey]: !flagValue })
                }}
              ></ToggleButton>
            </Flex>
          )
        })}
      </Flex>
    )
  }
}
