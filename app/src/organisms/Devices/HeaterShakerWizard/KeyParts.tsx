import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  ALIGN_FLEX_START,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  Text,
  TYPOGRAPHY,
} from '@opentrons/components'
import HeaterShakerKeyParts from '../../../assets/images/heater-shaker-key-parts.png'
import HeaterShakerDeckLock from '../../../assets/videos/heater-shaker-setup/HS_Deck_Lock_Anim.webm'

export function KeyParts(): JSX.Element {
  const { t } = useTranslation('heater_shaker')
  return (
    <>
      <Text
        color={COLORS.darkBlack}
        paddingTop={SPACING.spacing3}
        fontWeight={TYPOGRAPHY.fontWeightBold}
        data-testid={'heater_shaker_wizard_keyparts_title'}
      >
        {t('heater_shaker_key_parts')}
      </Text>
      <Text
        color={COLORS.darkBlack}
        paddingTop={SPACING.spacing3}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        data-testid={'heater_shaker_wizard_keyparts_subtitle'}
      >
        <Trans
          t={t}
          i18nKey={'heater_shaker_orient_module'}
          components={{
            bold: <strong />,
          }}
        />
      </Text>
      <Flex
        flexDirection={DIRECTION_ROW}
        marginY={SPACING.spacing6}
        alignItems={ALIGN_FLEX_START}
      >
        <img src={HeaterShakerKeyParts} alt="Heater Shaker Key Parts" />

        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          marginTop={'8rem'}
          marginRight={SPACING.spacing6}
        >
          <Trans
            t={t}
            i18nKey={'heater_shaker_latch_description'}
            components={{
              bold: <strong />,
              block: (
                <Text
                  fontSize={TYPOGRAPHY.fontSizeP}
                  marginBottom={SPACING.spacing4}
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
                  marginBottom={SPACING.spacing4}
                />
              ),
            }}
          />
          <video
            css={css`
              max-width: 100%;
              max-height: 10rem;
            `}
            autoPlay={true}
            loop={true}
            controls={false}
            data-testid={'heater_shaker_deck_lock'}
          >
            <source src={HeaterShakerDeckLock} />
          </video>
        </Flex>
      </Flex>
    </>
  )
}
