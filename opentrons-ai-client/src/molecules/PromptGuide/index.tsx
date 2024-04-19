import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Link,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

const LABWARE_LIBRARY_URL = 'https://labware.opentrons.com/'

export function PromptGuide(): JSX.Element {
  const { t } = useTranslation('protocol_generator')

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING.spacing32}
      backgroundColor={COLORS.grey30}
      borderRadius={BORDERS.borderRadius12}
      gridGap={SPACING.spacing32}
      width="58.125rem"
    >
      <StyledText css={HEADER_TEXT_STYLE}>
        {t('what_typeof_protocol')}
      </StyledText>

      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        <StyledText css={BODY_TEXT_STYLE}>
          {t('make_sure_your_prompt')}
        </StyledText>
        <Flex
          css={BODY_TEXT_STYLE}
          flexDirection={DIRECTION_COLUMN}
          paddingLeft={SPACING.spacing32}
        >
          <ul>
            <li>
              <StyledText>{t('metadata')}</StyledText>
              <StyledUl>
                <li>
                  <StyledText>{t('application')}</StyledText>
                </li>
                <li>
                  <StyledText>{t('robot')}</StyledText>
                </li>
                <li>
                  <StyledText>{t('api')}</StyledText>
                </li>
              </StyledUl>
            </li>
            <li>
              <StyledText>{t('ot2_pipettes')}</StyledText>
            </li>
            <li>
              <StyledText>{t('modules')}</StyledText>
            </li>
            <li>
              <StyledText>{t('well_allocations')}</StyledText>
            </li>
            <li>
              <Trans
                t={t}
                i18nKey="tipracks_and_labware"
                components={{
                  a: <ExternalLink external href={LABWARE_LIBRARY_URL} />,
                  span: <StyledText css={BODY_TEXT_STYLE} />,
                }}
              />
            </li>
            <li>
              <StyledText>{t('commands')}</StyledText>
            </li>
          </ul>
        </Flex>
      </Flex>
      <Trans
        t={t}
        i18nKey="what_if_you"
        components={{
          bold: <strong />,
          span: <StyledText css={BODY_TEXT_STYLE} />,
        }}
      />
    </Flex>
  )
}

const HEADER_TEXT_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSize28};
  line-height: ${TYPOGRAPHY.lineHeight36};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
`
const BODY_TEXT_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSize20};
  line-height: ${TYPOGRAPHY.lineHeight24};
`
const StyledUl = styled.ul`
  padding-left: ${SPACING.spacing16};
  list-style-type: disc;
`

const ExternalLink = styled(Link)`
  font-size: ${TYPOGRAPHY.fontSize20};
  line-height: ${TYPOGRAPHY.lineHeight24};
  color: ${COLORS.black90};
  text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
`
