import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  SPACING,
  SPACING_AUTO,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'
import {
  ANALYTICS_CHANGE_CUSTOM_LABWARE_SOURCE_FOLDER,
  useTrackEvent,
} from '/app/redux/analytics'
import {
  changeCustomLabwareDirectory,
  getCustomLabwareDirectory,
  openCustomLabwareDirectory,
} from '/app/redux/custom-labware'

import type { ReactNode } from 'react'
import type { Dispatch } from '/app/redux/types'

export function AdditionalCustomLabwareSourceFolder(): ReactNode {
  const { t } = useTranslation('app_settings')
  const dispatch = useDispatch<Dispatch>()
  const labwarePath = useSelector(getCustomLabwareDirectory)
  const trackEvent = useTrackEvent()

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      gridGap={SPACING.spacing40}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText
          forwardedAs="h3"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          paddingBottom={SPACING.spacing8}
        >
          {t('additional_labware_folder_title')}
        </StyledText>
        <StyledText forwardedAs="p" paddingBottom={SPACING.spacing8}>
          {t('additional_folder_description')}
        </StyledText>
        <StyledText
          forwardedAs="h6"
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.grey50}
          paddingBottom={SPACING.spacing4}
        >
          {t('additional_folder_location')}
        </StyledText>
        {labwarePath !== '' ? (
          <Link
            role="button"
            css={TYPOGRAPHY.pRegular}
            color={COLORS.black90}
            onClick={() => dispatch(openCustomLabwareDirectory())}
          >
            {labwarePath}
            <Icon
              height="0.75rem"
              marginLeft={SPACING.spacing8}
              name="open-in-new"
            />
          </Link>
        ) : (
          <StyledText forwardedAs="p">{t('no_folder')}</StyledText>
        )}
      </Flex>
      {
        <TertiaryButton
          marginLeft={SPACING_AUTO}
          onClick={() => {
            dispatch(changeCustomLabwareDirectory())
            trackEvent({
              name: ANALYTICS_CHANGE_CUSTOM_LABWARE_SOURCE_FOLDER,
              properties: {},
            })
          }}
        >
          {labwarePath !== ''
            ? t('change_folder_button')
            : t('add_folder_button')}
        </TertiaryButton>
      }
    </Flex>
  )
}
