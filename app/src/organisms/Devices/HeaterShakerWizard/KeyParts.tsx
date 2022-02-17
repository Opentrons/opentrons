import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  SPACING_3,
  Text,
  TYPOGRAPHY,
} from '@opentrons/components'
import HeaterShakerKeyParts from '../../../assets/images/heater-shaker-key-parts.svg'
import HeaterShakerDeckLock from '../../../assets/images/HS_Deck_Lock_Anim 1.png'

export function KeyParts(): JSX.Element {
  const { t } = useTranslation('heater_shaker')
  return (
    <>
      <Text
        color={COLORS.darkBlack}
        paddingTop={SPACING.spacing3}
        fontWeight={TYPOGRAPHY.fontWeightBold}
        data-testId={`heater_shaker_wizard_keyparts_title`}
      >
        {t('heater_shaker_key_parts')}
      </Text>
      <Text
        color={COLORS.darkBlack}
        paddingTop={SPACING.spacing3}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        data-testId={`heater_shaker_wizard_keyparts_subtitle`}
      >
        <Trans
          t={t}
          i18nKey={'heater_shaker_orient_module'}
          components={{
            bold: <strong />,
          }}
        />
      </Text>
      <Flex flexDirection={DIRECTION_ROW} margin={SPACING.spacing6}>
        <Flex>
          <img src={HeaterShakerKeyParts} alt="Heater Shaker Key Parts" />
        </Flex>

        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          marginLeft={SPACING.spacing6}
        >
          <Trans
            t={t}
            i18nKey={'heater_shaker_latch_description'}
            components={{
              bold: <strong />,
              block: (
                <Text
                  fontSize={TYPOGRAPHY.fontSizeP}
                  marginBottom={SPACING_3}
                />
              ),
            }}
          />
          <Trans
            t={t}
            i18nKey={'heater_shaker_anchor_description'}
            components={{
              bold: <strong />,
              block: (
                <Text
                  fontSize={TYPOGRAPHY.fontSizeP}
                  marginBottom={SPACING_3}
                />
              ),
            }}
          />
          <img src={HeaterShakerDeckLock} alt="Heater Shaker Deck Lock" />
        </Flex>
      </Flex>
    </>
  )
}
