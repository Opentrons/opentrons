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

import screwInAdapter from '@opentrons/app/src/assets/images/heater_shaker_adapter_screwdriver.png'
import heaterShakerAdapterAlignment from '@opentrons/app/src/assets/images/heater_shaker_adapter_alignment.png'
import { TertiaryButton } from '../../../atoms/buttons'
import { Tooltip } from '../../../atoms/Tooltip'
import { StyledText } from '../../../atoms/text'
import { useLatchControls } from '../../ModuleCard/hooks'

import type { HeaterShakerModule } from '../../../redux/modules/types'

interface AttachAdapterProps {
  module: HeaterShakerModule
  runId?: string
}
export function AttachAdapter(props: AttachAdapterProps): JSX.Element {
  const { module, runId } = props
  const { t } = useTranslation('heater_shaker')
  const { toggleLatch, isLatchClosed } = useLatchControls(module, runId)
  const [targetProps, tooltipProps] = useHoverTooltip()
  const isShaking = module.data.speedStatus !== 'idle'

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
    >
      <Flex paddingBottom={SPACING.spacingL}>
        {t('step_3_of_4_attach_adapter')}
      </Flex>
      <Flex flexDirection={DIRECTION_ROW}>
        <StyledText
          color={COLORS.darkGrey}
          paddingRight={SPACING.spacing4}
          data-testid={`attach_adapter_2a`}
        >
          {t('3a')}
        </StyledText>
        <Flex border={`${SPACING.spacingXXS} solid ${COLORS.medGrey}`}>
          <Flex
            padding={`${SPACING.spacing2} 5rem ${SPACING.spacing4} ${SPACING.spacing7}`}
            data-testid={`attach_adapter_screw_in_adapter_image`}
          >
            <img height="160px" src={screwInAdapter} alt="screw_in_adapter" />
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <Flex
              marginTop={SPACING.spacing4}
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              data-testid={`attach_adapter_to_module`}
            >
              {t('attach_adapter_to_module')}
            </Flex>
            <Flex
              marginTop={SPACING.spacing3}
              backgroundColor={COLORS.background}
              paddingTop={SPACING.spacing4}
              paddingRight={SPACING.spacing4}
              paddingLeft={SPACING.spacing4}
              flexDirection={DIRECTION_ROW}
              marginRight={SPACING.spacingSM}
              data-testid={`attach_adapter_2a_body_text`}
            >
              <Flex
                size="2rem"
                color={COLORS.darkGreyEnabled}
                paddingBottom={SPACING.spacing4}
              >
                <Icon name="information" aria-label="information" />
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                paddingLeft={SPACING.spacing3}
                fontSize={TYPOGRAPHY.fontSizeP}
                paddingBottom={SPACING.spacing4}
              >
                <StyledText paddingBottom={SPACING.spacing2}>
                  {t('attach_screwdriver_and_screw')}
                </StyledText>
                <StyledText fontWeight={TYPOGRAPHY.fontWeightRegular}>
                  {t('attach_screwdriver_and_screw_explanation')}
                </StyledText>
              </Flex>
            </Flex>
            <TertiaryButton
              marginLeft={SIZE_AUTO}
              marginRight={SPACING.spacingSM}
              marginY={SPACING.spacing4}
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
      <Flex flexDirection={DIRECTION_ROW} marginTop={SPACING.spacingSM}>
        <StyledText
          color={COLORS.darkGrey}
          paddingRight={SPACING.spacing4}
          data-testid={`attach_adapter_2b`}
        >
          {t('3b')}
        </StyledText>
        <Flex
          border={`${SPACING.spacingXXS} solid ${COLORS.medGrey}`}
          width="100%"
        >
          <Flex
            padding={`${SPACING.spacingM} 2.5rem ${SPACING.spacingXL} ${SPACING.spacingXL}`}
            data-testid={`attach_adapter_alignment_image`}
          >
            <img
              src={heaterShakerAdapterAlignment}
              alt="heater_shaker_adapter_alignment"
            />
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            marginTop={SPACING.spacingL}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            marginRight="3rem"
            data-testid={`attach_adapter_alignment_text`}
          >
            <StyledText>{t('check_alignment')}</StyledText>
            <StyledText paddingTop={SPACING.spacing4}>
              {t('a_properly_attached_adapter')}
            </StyledText>
          </Flex>
        </Flex>
      </Flex>
      <Flex flexDirection={DIRECTION_ROW} marginTop={SPACING.spacingSM}>
        <StyledText
          color={COLORS.darkGrey}
          paddingRight={SPACING.spacing4}
          data-testid={`attach_adapter_3a`}
        >
          {t('3c')}
        </StyledText>
        <Flex
          border={`${SPACING.spacingXXS} solid ${COLORS.medGrey}`}
          flexDirection={DIRECTION_COLUMN}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          padding={`${SPACING.spacing4} ${SPACING.spacingM} ${SPACING.spacingM} ${SPACING.spacing4}`}
          width="100%"
          marginBottom={SPACING.spacingSM}
          data-testid={`attach_adapter_check_alignment_instructions`}
        >
          <StyledText>{t('check_alignment_instructions')}</StyledText>
        </Flex>
      </Flex>
    </Flex>
  )
}
