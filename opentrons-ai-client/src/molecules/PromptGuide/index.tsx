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
    >
      <StyledText css={HEADER_TEXT_STYLE}>
        {t('what_typeof_protocol')}
      </StyledText>

      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        <StyledText css={BODY_TEXT_STYLE}>
          {t('make_sure_your_prompt')}
        </StyledText>
        <StyledText css={BODY_TEXT_STYLE}>{t('key_info')}</StyledText>
        <Flex
          css={BODY_TEXT_STYLE}
          flexDirection={DIRECTION_COLUMN}
          paddingLeft={SPACING.spacing32}
        >
          <StyledUl>
            <li>
              <StyledText>{t('robot_type')}</StyledText>
            </li>
            <li>
              <StyledText>{t('modules_and_adapters')}</StyledText>
            </li>
            <li>
              <Trans
                t={t}
                i18nKey="labware_and_tipracks"
                components={{
                  a: <ExternalLink external href={LABWARE_LIBRARY_URL} />,
                  span: <StyledText css={BODY_TEXT_STYLE} />,
                }}
              />
            </li>
            <li>
              <StyledText>{t('pipettes')}</StyledText>
            </li>
            <li>
              <StyledText>{t('liquid_locations')}</StyledText>
            </li>
            <li>
              <StyledText>{t('commands')}</StyledText>
            </li>
          </StyledUl>
        </Flex>
        <StyledText css={BODY_TEXT_STYLE}>{t('notes')}</StyledText>
        <Flex
          css={BODY_TEXT_STYLE}
          flexDirection={DIRECTION_COLUMN}
          paddingLeft={SPACING.spacing32}
        >
          <StyledUl>
            <li>
              <StyledText>{t('example')}</StyledText>
            </li>
            <li>
              <StyledText>{t('simulate_description')}</StyledText>
            </li>
            <li>
              <StyledText>{t('reload_page')}</StyledText>
            </li>
          </StyledUl>
        </Flex>
      </Flex>
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
