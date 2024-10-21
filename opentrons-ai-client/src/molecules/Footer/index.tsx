import styled from 'styled-components'
import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'

const NewLineText = styled.span`
  display: block;
`

const BlueLink = styled.a`
  color: ${COLORS.blue50};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`

const FooterText = styled.p`
  color: ${COLORS.grey60};
  font-size: ${TYPOGRAPHY.fontSizeH4};
  line-height: ${TYPOGRAPHY.lineHeight16};
  text-align: ${TYPOGRAPHY.textAlignCenter};
  padding-bottom: ${SPACING.spacing24};
`

export function Footer(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const privacyPolicyText = t('privacy_policy')
  const [
    firstPart,
    privacyPolicy,
    and,
    EULA,
    copyright,
  ] = privacyPolicyText.split('\n')

  return (
    <Flex
      width="100%"
      height="88px"
      backgroundColor={COLORS.grey10}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      paddingTop={SPACING.spacing24}
    >
      <FooterText>
        {firstPart}
        <BlueLink
          href="https://insights.opentrons.com/hubfs/Legal%20Documentation/Opentrons-Labworks-Privacy-Policy-5-4-23.docx-1.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          {privacyPolicy}
        </BlueLink>
        {and}
        <BlueLink
          href="https://insights.opentrons.com/hubfs/Legal%20Documentation/Opentrons%20EULA%2020240710.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          {EULA}
        </BlueLink>
        <NewLineText>{copyright}</NewLineText>
      </FooterText>
    </Flex>
  )
}
