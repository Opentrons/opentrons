import React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  COLORS,
  JUSTIFY_CENTER,
  DIRECTION_ROW,
  LabwareRender,
  SPACING,
  ALIGN_CENTER,
  BORDERS,
  RobotWorkSpace,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import heaterShaker from '@opentrons/app/src/assets/images/heater_shaker_empty.png'
import flatBottom from '@opentrons/app/src/assets/images/flatbottom_thermal_adapter.png'
import deepwell from '@opentrons/app/src/assets/images/deepwell_thermal_adapter.png'
import pcr from '@opentrons/app/src/assets/images/pcr_thermal_adapter.png'
import universal from '@opentrons/app/src/assets/images/universal_thermal_adapter.png'
import screwdriver from '@opentrons/app/src/assets/images/t10_torx_screwdriver.png'
import { StyledText } from '@opentrons/app/src/atoms/text/StyledText'

import type {
  LabwareDefinition2,
  ModuleModel,
  ThermalAdapterName,
} from '@opentrons/shared-data'

const VIEW_BOX = '-20 -10 160 100'

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
      <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING.spacingM}>
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
      marginTop={SPACING.spacing3}
      border={`${SPACING.spacingXXS} ${BORDERS.styleSolid} ${COLORS.medGreyEnabled}`}
      flexDirection={DIRECTION_ROW}
      width="21.5rem"
      paddingBottom={SPACING.spacing3}
    >
      {props.image != null ? (
        <>
          <Flex paddingLeft={SPACING.spacingXS} paddingTop={SPACING.spacing3}>
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
  labwareDefinition: LabwareDefinition2 | null
  thermalAdapterName: ThermalAdapterName | null
  moduleModel: ModuleModel
}

const THERMAL_ADAPTER_TRANSFORM = css`
  transform: scale(1.4);
  transform-origin: 90% 50%;
`

export function Introduction(props: IntroductionProps): JSX.Element {
  const { labwareDefinition, thermalAdapterName } = props
  const { t } = useTranslation('heater_shaker')

  let adapterImage: string = ''
  switch (thermalAdapterName) {
    case 'PCR Adapter':
      adapterImage = pcr
      break
    case 'Universal Flat Adapter':
      adapterImage = universal
      break
    case 'Deep Well Adapter':
      adapterImage = deepwell
      break
    case '96 Flat Bottom Adapter':
      adapterImage = flatBottom
      break
  }

  return (
    <Flex
      padding={SPACING.spacingM}
      flexDirection={DIRECTION_COLUMN}
      marginBottom={labwareDefinition != null ? '4.313rem' : '9.375rem'}
    >
      <StyledText css={TYPOGRAPHY.h2Regular} data-testid={`introduction_title`}>
        {t('use_this_heater_shaker_guide')}
      </StyledText>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex justifyContent={JUSTIFY_CENTER}>
          <StyledText
            paddingTop="0.563rem"
            fontSize={TYPOGRAPHY.fontSizeH4}
            flexDirection={DIRECTION_ROW}
            width="21.5rem"
            data-testid={`introduction_subtitle`}
          >
            {t('you_will_need')}
          </StyledText>
        </Flex>
        <Flex
          justifyContent={JUSTIFY_CENTER}
          data-testid={`introduction_item_adapter`}
        >
          <IntroItem
            text={
              thermalAdapterName != null
                ? t('adapter_name_and_screw', { adapter: thermalAdapterName })
                : t('unknown_adapter_and_screw')
            }
            subtext={t('screw_may_be_in_module')}
            image={
              thermalAdapterName != null ? (
                <Flex
                  width="6.2rem"
                  height="4.313rem"
                  css={THERMAL_ADAPTER_TRANSFORM}
                >
                  <img src={adapterImage} alt={`${thermalAdapterName}`} />
                </Flex>
              ) : undefined
            }
          />
        </Flex>
        <Flex
          justifyContent={JUSTIFY_CENTER}
          data-testid={`introduction_item_labware`}
        >
          <IntroItem
            text={
              labwareDefinition != null
                ? labwareDefinition.metadata.displayName
                : t('labware')
            }
            image={
              labwareDefinition != null ? (
                <Flex width="6.2rem" height="4.3rem">
                  <RobotWorkSpace viewBox={VIEW_BOX}>
                    {() => {
                      return (
                        <React.Fragment>
                          <LabwareRender definition={labwareDefinition} />
                        </React.Fragment>
                      )
                    }}
                  </RobotWorkSpace>
                </Flex>
              ) : undefined
            }
          />
        </Flex>
        <Flex
          justifyContent={JUSTIFY_CENTER}
          data-testid={`introduction_item_heater_shaker`}
        >
          <IntroItem
            image={<img src={heaterShaker} alt="heater_shaker_image" />}
            text={getModuleDisplayName(props.moduleModel)}
          />
        </Flex>
        <Flex
          justifyContent={JUSTIFY_CENTER}
          data-testid={`intrudction_intro_item_screwdriver`}
        >
          <IntroItem
            image={<img src={screwdriver} alt="screwdriver_image" />}
            text={t('t10_torx_screwdriver', { name: 'T10 Torx' })}
            subtext={t('about_screwdriver')}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
