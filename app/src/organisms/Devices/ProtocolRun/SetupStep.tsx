import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Box,
  Btn,
  Flex,
  Icon,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'

interface SetupStepProps {
  expanded: boolean
  title: React.ReactNode
  description: string
  label: string
  toggleExpanded: () => void
  children: React.ReactNode
  calibrationStatusComplete: boolean | null
}

const EXPANDED_STYLE = css`
  transition: max-height 300ms ease-in, visibility 400ms ease;
  visibility: visible;
  max-height: 180vh;
  overflow: hidden;
`
const COLLAPSED_STYLE = css`
  transition: max-height 500ms ease-out, visibility 600ms ease;
  visibility: hidden;
  max-height: 0vh;
  overflow: hidden;
`
const ACCORDION_STYLE = css`
  border-radius: 50%;
  &:hover {
    background: ${COLORS.lightGreyHover};
  }
  &:active {
    background: ${COLORS.lightGreyPressed};
  }
`
export function SetupStep({
  expanded,
  title,
  description,
  label,
  toggleExpanded,
  children,
  calibrationStatusComplete,
}: SetupStepProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Btn textAlign={TYPOGRAPHY.textAlignLeft}>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            width="100%"
            onClick={toggleExpanded}
          >
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText
                color={COLORS.darkGreyEnabled}
                css={TYPOGRAPHY.h6SemiBold}
                marginBottom={SPACING.spacing1}
                id={`CollapsibleStep_${label}`}
              >
                {label}
              </StyledText>
              <StyledText
                color={COLORS.darkBlackEnabled}
                css={TYPOGRAPHY.h3SemiBold}
                marginBottom={SPACING.spacing2}
                id={`CollapsibleStep_${title}`}
              >
                {title}
              </StyledText>
              <StyledText
                as="p"
                color={COLORS.darkBlackEnabled}
                id={`CollapsibleStep_${description}`}
              >
                {description}
              </StyledText>
            </Flex>
            <Flex alignItems={ALIGN_CENTER} flexDirection={DIRECTION_ROW}>
              {calibrationStatusComplete !== null ? (
                <Flex flexDirection={DIRECTION_ROW}>
                  <Icon
                    size={SIZE_1}
                    color={
                      calibrationStatusComplete
                        ? COLORS.successEnabled
                        : COLORS.warningEnabled
                    }
                    marginRight={SPACING.spacing3}
                    name={
                      calibrationStatusComplete ? 'ot-check' : 'alert-circle'
                    }
                    id="RunSetupCard_calibrationIcon"
                  />
                  <StyledText
                    color={COLORS.black}
                    css={TYPOGRAPHY.pSemiBold}
                    marginRight={SPACING.spacing4}
                    textTransform={TYPOGRAPHY.textTransformCapitalize}
                    id="RunSetupCard_calibrationText"
                  >
                    {calibrationStatusComplete
                      ? t('calibration_ready')
                      : t('calibration_needed')}
                  </StyledText>
                </Flex>
              ) : null}
              <Icon
                color={COLORS.darkBlackEnabled}
                size="1.5rem"
                css={ACCORDION_STYLE}
                name={expanded ? 'minus' : 'plus'}
                margin={SPACING.spacing2}
              />
            </Flex>
          </Flex>
        </Flex>
      </Btn>
      <Box css={expanded ? EXPANDED_STYLE : COLLAPSED_STYLE}>{children}</Box>
    </Flex>
  )
}
