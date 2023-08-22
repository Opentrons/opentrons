import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Icon,
  TYPOGRAPHY,
  SPACING,
  SIZE_AUTO,
  useHoverTooltip,
} from '@opentrons/components'

import screwInAdapter from '../../../assets/images/heater_shaker_adapter_screwdriver.png'
import heaterShakerAdapterAlignment from '../../../assets/images/heater_shaker_adapter_alignment.png'
import { TertiaryButton } from '../../../atoms/buttons'
import { Tooltip } from '../../../atoms/Tooltip'
import { StyledText } from '../../../atoms/text'
import { useLatchControls } from '../../ModuleCard/hooks'

import type { HeaterShakerModule } from '../../../redux/modules/types'

interface AttachAdapterProps {
  module: HeaterShakerModule
}
export function AttachAdapter(props: AttachAdapterProps): JSX.Element {
  const { module } = props
  const { t } = useTranslation('heater_shaker')
  const { toggleLatch, isLatchClosed } = useLatchControls(module)
  const [targetProps, tooltipProps] = useHoverTooltip()
  const isShaking = module.data.speedStatus !== 'idle'

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
    >
      <Flex paddingBottom="1.625rem">{t('step_3_of_4_attach_adapter')}</Flex>
      <Flex flexDirection={DIRECTION_ROW}>
        <StyledText
          color={COLORS.darkGrey}
          paddingRight={SPACING.spacing16}
          data-testid="attach_adapter_2a"
        >
          {t('3a')}
        </StyledText>
        <Flex border={`1px solid ${COLORS.medGreyEnabled}`}>
          <Flex
            padding={`${SPACING.spacing4} ${SPACING.spacing80} ${SPACING.spacing16} ${SPACING.spacing48}`}
            data-testid="attach_adapter_screw_in_adapter_image"
          >
            <img height="160px" src={screwInAdapter} alt="screw_in_adapter" />
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <Flex
              marginTop={SPACING.spacing16}
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              data-testid="attach_adapter_to_module"
            >
              {t('attach_adapter_to_module')}
            </Flex>
            <Flex
              marginTop={SPACING.spacing8}
              backgroundColor={COLORS.fundamentalsBackground}
              paddingTop={SPACING.spacing16}
              paddingRight={SPACING.spacing16}
              paddingLeft={SPACING.spacing16}
              flexDirection={DIRECTION_ROW}
              marginRight={SPACING.spacing12}
              data-testid="attach_adapter_2a_body_text"
            >
              <Flex
                size="2rem"
                color={COLORS.darkGreyEnabled}
                paddingBottom={SPACING.spacing16}
              >
                <Icon name="information" aria-label="information" />
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                paddingLeft={SPACING.spacing8}
                fontSize={TYPOGRAPHY.fontSizeP}
                paddingBottom={SPACING.spacing16}
              >
                <StyledText paddingBottom={SPACING.spacing4}>
                  {t('attach_screwdriver_and_screw')}
                </StyledText>
                <StyledText fontWeight={TYPOGRAPHY.fontWeightRegular}>
                  {t('attach_screwdriver_and_screw_explanation')}
                </StyledText>
              </Flex>
            </Flex>
            <TertiaryButton
              marginLeft={SIZE_AUTO}
              marginRight={SPACING.spacing12}
              marginY={SPACING.spacing16}
              onClick={toggleLatch}
              disabled={isShaking}
              {...targetProps}
            >
              {isLatchClosed
                ? t('open_labware_latch')
                : t('close_labware_latch')}
            </TertiaryButton>
            {isShaking ? (
              <Tooltip tooltipProps={tooltipProps}>
                {t('cannot_open_latch')}
              </Tooltip>
            ) : null}
          </Flex>
        </Flex>
      </Flex>
      <Flex flexDirection={DIRECTION_ROW} marginTop={SPACING.spacing12}>
        <StyledText
          color={COLORS.darkGrey}
          paddingRight={SPACING.spacing16}
          data-testid="attach_adapter_2b"
        >
          {t('3b')}
        </StyledText>
        <Flex border={`1px solid ${COLORS.medGreyEnabled}`} width="100%">
          <Flex
            padding={`${SPACING.spacing20} ${SPACING.spacing40} ${SPACING.spacing32} ${SPACING.spacing32}`}
            data-testid="attach_adapter_alignment_image"
          >
            <img
              src={heaterShakerAdapterAlignment}
              alt="heater_shaker_adapter_alignment"
            />
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            marginTop="1.625rem"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            marginRight="3rem"
            data-testid="attach_adapter_alignment_text"
          >
            <StyledText>{t('check_alignment')}</StyledText>
            <StyledText paddingTop={SPACING.spacing16}>
              {t('a_properly_attached_adapter')}
            </StyledText>
          </Flex>
        </Flex>
      </Flex>
      <Flex flexDirection={DIRECTION_ROW} marginTop={SPACING.spacing12}>
        <StyledText
          color={COLORS.darkGrey}
          paddingRight={SPACING.spacing16}
          data-testid="attach_adapter_3a"
        >
          {t('3c')}
        </StyledText>
        <Flex
          border={`1px solid ${COLORS.medGreyEnabled}`}
          flexDirection={DIRECTION_COLUMN}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          padding={`${SPACING.spacing16} ${SPACING.spacing20} ${SPACING.spacing20} ${SPACING.spacing16}`}
          width="100%"
          marginBottom={SPACING.spacing12}
          data-testid="attach_adapter_check_alignment_instructions"
        >
          <StyledText>{t('check_alignment_instructions')}</StyledText>
        </Flex>
      </Flex>
    </Flex>
  )
}
