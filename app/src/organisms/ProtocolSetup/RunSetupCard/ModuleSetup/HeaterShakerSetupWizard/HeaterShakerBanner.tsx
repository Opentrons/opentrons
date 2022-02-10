import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  Flex,
  Text,
  TEXT_TRANSFORM_UPPERCASE,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_ROW,
  ALIGN_CENTER,
  Btn,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'
import type { ModuleDefinition } from '@opentrons/shared-data'

interface HeaterShakerBannerProps {
  moduleDef: ModuleDefinition
}

export function HeaterShakerBanner(
  props: HeaterShakerBannerProps
): JSX.Element | null {
  const { moduleDef } = props
  const { t } = useTranslation('heater_shaker')

  return (
    <React.Fragment>
      <Flex
        marginTop={TYPOGRAPHY.lineHeight16}
        flexDirection={DIRECTION_ROW}
        backgroundColor={COLORS.background}
        padding={SPACING.spacing3}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Text
            color={COLORS.darkGrey}
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            fontSize={TYPOGRAPHY.fontSizeH6}
          >
            {/* TODO immediately: add in slot number, its stubbed for now until we can access protocol context */}
            {'Slot 1'}
          </Text>
          <Text
            paddingTop={SPACING.spacing2}
            color={COLORS.darkBlack}
            fontSize={TYPOGRAPHY.fontSizeP}
          >
            {moduleDef.displayName}
          </Text>
          <Text
            paddingTop={SPACING.spacing2}
            color={COLORS.darkGrey}
            fontSize={TYPOGRAPHY.fontSizeH6}
          >
            {t('banner_body')}
          </Text>
        </Flex>
        <Btn
          color={COLORS.blue}
          fontSize={TYPOGRAPHY.fontSizeH6}
          alignItems={ALIGN_CENTER}
          paddingRight={SPACING.spacing3}
          onClick={() => console.log('open wizard')}
        >
          {t('banner_wizard_link')}
        </Btn>
      </Flex>
    </React.Fragment>
  )
}
