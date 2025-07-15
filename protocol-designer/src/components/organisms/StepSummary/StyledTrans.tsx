import { Trans, useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Flex,
  NO_WRAP,
  SPACING,
  StyledText,
  Tag,
  WRAP,
} from '@opentrons/components'

interface StyledTransProps {
  i18nKey: string
  tagText?: string
  values?: object
}

export function StyledTrans(props: StyledTransProps): JSX.Element {
  const { i18nKey, tagText, values } = props
  const { t } = useTranslation(['protocol_steps', 'application'])

  return (
    <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER} flexWrap={WRAP}>
      <Trans
        t={t}
        i18nKey={i18nKey}
        components={{
          text: (
            <Flex style={{ whiteSpace: NO_WRAP }}>
              <StyledText desktopStyle="bodyDefaultRegular" />
            </Flex>
          ),
          semiBoldText: (
            <Flex style={{ whiteSpace: NO_WRAP }}>
              <StyledText desktopStyle="bodyDefaultSemiBold" />
            </Flex>
          ),
          tag: <Tag type="default" text={tagText ?? ''} />,
        }}
        values={values}
      />
    </Flex>
  )
}
