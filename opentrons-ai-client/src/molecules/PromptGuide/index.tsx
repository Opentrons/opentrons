import { Trans, useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Link,
  SPACING,
  LegacyStyledText,
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
      <LegacyStyledText css={HEADER_TEXT_STYLE}>
        {t('what_typeof_protocol')}
      </LegacyStyledText>

      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        <LegacyStyledText css={BODY_TEXT_STYLE}>
          {t('make_sure_your_prompt')}
        </LegacyStyledText>
        <LegacyStyledText css={BODY_TEXT_STYLE}>
          {t('key_info')}
        </LegacyStyledText>
        <Flex
          css={BODY_TEXT_STYLE}
          flexDirection={DIRECTION_COLUMN}
          paddingLeft={SPACING.spacing32}
        >
          <StyledUl>
            <li>
              <LegacyStyledText>{t('robot_type')}</LegacyStyledText>
            </li>
            <li>
              <LegacyStyledText>{t('modules_and_adapters')}</LegacyStyledText>
            </li>
            <li>
              <Trans
                t={t}
                i18nKey="labware_and_tipracks"
                components={{
                  a: <ExternalLink external href={LABWARE_LIBRARY_URL} />,
                  span: <LegacyStyledText css={BODY_TEXT_STYLE} />,
                }}
              />
            </li>
            <li>
              <LegacyStyledText>{t('pipettes')}</LegacyStyledText>
            </li>
            <li>
              <LegacyStyledText>{t('liquid_locations')}</LegacyStyledText>
            </li>
            <li>
              <LegacyStyledText>{t('commands')}</LegacyStyledText>
            </li>
          </StyledUl>
        </Flex>
        <LegacyStyledText css={BODY_TEXT_STYLE}>{t('notes')}</LegacyStyledText>
        <Flex
          css={BODY_TEXT_STYLE}
          flexDirection={DIRECTION_COLUMN}
          paddingLeft={SPACING.spacing32}
        >
          <StyledUl>
            <li>
              <LegacyStyledText>{t('example')}</LegacyStyledText>
            </li>
            <li>
              <LegacyStyledText>{t('simulate_description')}</LegacyStyledText>
            </li>
            <li>
              <LegacyStyledText>{t('reload_page')}</LegacyStyledText>
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
