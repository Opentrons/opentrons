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
  tagText2?: string
  values?: object
}

export function StyledTrans(props: StyledTransProps): JSX.Element {
  const { i18nKey, tagText, tagText2, values } = props
  const { t } = useTranslation(['protocol_steps', 'application'])

  return (
    <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER} flexWrap={WRAP}>
      <Trans
        t={t}
        i18nKey={i18nKey}
        components={{
          text: (
            <StyledText
              desktopStyle="bodyDefaultRegular"
              style={{ whiteSpace: NO_WRAP }}
            />
          ),
          semiBoldText: (
            <StyledText
              desktopStyle="bodyDefaultSemiBold"
              style={{ whiteSpace: NO_WRAP }}
            />
          ),
          tag: <Tag type="default" text={tagText ?? ''} />,
          tag2: <Tag type="default" text={tagText2 ?? ''} />,
        }}
        values={values}
      />
    </Flex>
  )
}
