import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import {
  Flex,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { Divider } from '../../atoms/structure'
import { StyledText } from '../../atoms/text'
import { ToggleButton } from '../../atoms/buttons'
import * as Config from '../../redux/config'

import type { DevInternalFlag } from '../../redux/config/types'
import type { Dispatch } from '../../redux/types'

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
      paddingX={SPACING.spacing4}
      paddingY={SPACING.spacing5}
    >
      {Config.DEV_INTERNAL_FLAGS.map((flag, index) => (
        <React.Fragment key={flag}>
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <StyledText
              as="h3"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              id={`FeatureFlags_${flag}_text`}
            >
              {t(`__dev_internal__${flag}`)}
            </StyledText>
            <ToggleButton
              label={`${flag}-toggle`}
              toggledOn={Boolean(devInternalFlags?.[flag])}
              onClick={() => dispatch(() => toggleDevInternalFlag(flag))}
              id={`FeatureFlags_${flag}_button`}
            />
          </Flex>
          {index !== Config.DEV_INTERNAL_FLAGS.length - 1 && (
            <Divider marginY={SPACING.spacing5} />
          )}
        </React.Fragment>
      ))}
    </Flex>
  )
}
