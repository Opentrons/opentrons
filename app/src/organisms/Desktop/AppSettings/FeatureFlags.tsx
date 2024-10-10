import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { Divider } from '/app/atoms/structure'
import { ToggleButton } from '/app/atoms/buttons'
import * as Config from '/app/redux/config'

import type { DevInternalFlag } from '/app/redux/config/types'
import type { Dispatch } from '/app/redux/types'

export function FeatureFlags(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const devInternalFlags = useSelector(Config.getFeatureFlags)
  const dispatch = useDispatch<Dispatch>()
  const toggleDevInternalFlag = (flag: DevInternalFlag): unknown =>
    dispatch(Config.toggleDevInternalFlag(flag))

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      minHeight="calc(100vh - 8.5rem)"
      paddingX={SPACING.spacing16}
      paddingY={SPACING.spacing24}
    >
      {Config.DEV_INTERNAL_FLAGS.map((flag, index) => (
        <Fragment key={flag}>
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <LegacyStyledText
              as="h3"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              id={`FeatureFlags_${flag}_text`}
            >
              {t(`__dev_internal__${flag}`)}
            </LegacyStyledText>
            <ToggleButton
              label={`${flag}-toggle`}
              toggledOn={Boolean(devInternalFlags?.[flag])}
              onClick={() => dispatch(() => toggleDevInternalFlag(flag))}
              id={`FeatureFlags_${flag}_button`}
            />
          </Flex>
          {index !== Config.DEV_INTERNAL_FLAGS.length - 1 && (
            <Divider marginY={SPACING.spacing24} />
          )}
        </Fragment>
      ))}
    </Flex>
  )
}
