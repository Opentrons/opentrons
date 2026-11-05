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

import type { ReactNode } from 'react'
import type { IconName } from '@opentrons/components'

interface TagInfo {
  text: string
  iconName?: IconName
}
interface StyledTransProps {
  i18nKey: string
  tagInfos?: TagInfo[]
  values?: object
}

export function StyledTrans(props: StyledTransProps): ReactNode {
  const { i18nKey, tagInfos, values } = props
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
          ...(tagInfos ?? []).reduce<Record<string, JSX.Element>>(
            (acc, { text, iconName }, index) => {
              // to preserve old behavior as best as possible, we don't index the first `tag` in the translation
              const key = index === 0 ? 'tag' : `tag${index + 1}`
              return {
                ...acc,
                [key]: (
                  <Tag
                    key={index}
                    type="default"
                    text={text}
                    iconName={iconName}
                    iconPosition="left"
                  />
                ),
              }
            },
            {}
          ),
        }}
        values={values}
      />
    </Flex>
  )
}
