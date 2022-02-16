import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  Text,
  TYPOGRAPHY,
  COLORS,
  JUSTIFY_CENTER,
  DIRECTION_ROW,
  LabwareRender,
  SPACING,
  ALIGN_CENTER,
} from '@opentrons/components'

import heaterShaker from '@opentrons/app/src/assets/images/heater_shaker_empty.png'
import screwdriver from '@opentrons/app/src/assets/images/change-pip/t10_torx_screwdriver.png'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

interface IntroContainerProps {
  text: string
  image?: JSX.Element
  subtext?: string
}

const IntroItem = (props: IntroContainerProps): JSX.Element => {
  let multiText: JSX.Element = <div></div>
  const leftPadding = props.image != null ? SPACING.spacingL : SPACING.spacing3

  if (props.subtext != null) {
    multiText = (
      <Flex flexDirection={DIRECTION_COLUMN} paddingRight={'1.25rem'}>
        <Flex
          fontSize={TYPOGRAPHY.fontSizeLabel}
          paddingLeft={leftPadding}
          paddingTop={SPACING.spacing3}
          alignItems={ALIGN_CENTER}
        >
          {props.text}
        </Flex>
        <Flex
          fontSize={TYPOGRAPHY.fontSizeH6}
          paddingLeft={leftPadding}
          paddingTop={SPACING.spacing1}
          alignItems={ALIGN_CENTER}
        >
          {props.subtext}
        </Flex>
      </Flex>
    )
  } else {
    multiText = (
      <Flex
        fontSize={TYPOGRAPHY.fontSizeLabel}
        paddingLeft={leftPadding}
        paddingTop={SPACING.spacing3}
        alignItems={ALIGN_CENTER}
      >
        {props.text}
      </Flex>
    )
  }
  return (
    <Flex
      marginTop={'0.625rem'}
      border={`1px solid ${COLORS.medGrey}`}
      flexDirection={DIRECTION_ROW}
      width={'21.5rem'}
      paddingBottom={'0.625rem'}
    >
      {props.image != null ? (
        <>
          <Flex paddingLeft={SPACING.spacingXS} paddingTop={'0.625rem'}>
            {props.image}
          </Flex>
          {multiText}
        </>
      ) : (
        <Flex>{multiText}</Flex>
      )}
    </Flex>
  )
}
interface IntroductionProps {
  labwareDefinition?: LabwareDefinition2
  thermalAdapterName?: string
}

export function Introduction(props: IntroductionProps): JSX.Element {
  const { labwareDefinition, thermalAdapterName } = props
  const { t } = useTranslation('heater_shaker')

  return (
    <Flex
      padding={TYPOGRAPHY.lineHeight20}
      flexDirection={DIRECTION_COLUMN}
      color={COLORS.darkBlack}
      fontWeight={TYPOGRAPHY.fontWeightRegular}
      marginBottom={labwareDefinition != null ? '4.313rem' : '9.375rem'}
    >
      <Text
        fontSize={TYPOGRAPHY.lineHeight16}
        width="39.625rem"
        data-testid={`heater_shaker_wizard_intro_title`}
      >
        {t('intro_title')}
      </Text>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Text
          paddingTop={TYPOGRAPHY.fontSizeH6}
          fontSize={TYPOGRAPHY.fontSizeH4}
          paddingLeft={'8rem'}
          data-testid={`heater_shaker_wizard_intro_subtitle`}
        >
          {t('intro_subtitle')}
        </Text>
        <Flex
          justifyContent={JUSTIFY_CENTER}
          data-testid={`heater_shaker_wizard_intro_item_adapter`}
        >
          <IntroItem
            text={
              thermalAdapterName != null
                ? t('intro_adapter_known', { adapter: thermalAdapterName })
                : t('intro_adapter_unknown')
            }
            subtext={t('intro_adapter_body')}
            //  TODO(jr, 2022-02-16): plus in thermal adapter image
            image={
              thermalAdapterName != null ? (
                <Flex width={'6.25rem'} height={'4.313rem'}>
                  <div>{'thermal adapter image'}</div>
                </Flex>
              ) : undefined
            }
          />
        </Flex>
        <Flex
          justifyContent={JUSTIFY_CENTER}
          data-testid={`heater_shaker_wizard_intro_item_labware`}
        >
          <IntroItem
            text={
              labwareDefinition != null
                ? labwareDefinition.metadata.displayName
                : t('intro_labware')
            }
            image={
              labwareDefinition != null ? (
                <Flex width={'6.25rem'} height={'4.313rem'}>
                  <LabwareRender definition={labwareDefinition} />
                </Flex>
              ) : undefined
            }
          />
        </Flex>
        <Flex
          justifyContent={JUSTIFY_CENTER}
          data-testid={`heater_shaker_wizard_intro_item_heater_shaker`}
        >
          <IntroItem
            image={<img src={heaterShaker} alt={'heater_shaker_image'} />}
            text={t('intro_heater_shaker_mod')}
          />
        </Flex>
        <Flex
          justifyContent={JUSTIFY_CENTER}
          data-testid={`heater_shaker_wizard_intro_item_screwdriver`}
        >
          <IntroItem
            image={<img src={screwdriver} alt={'screwdriver_image'} />}
            text={t('intro_screwdriver')}
            subtext={t('intro_screwdriver_body')}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
