import React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import Markdown from 'react-markdown'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import type { ChatData } from '../../resources/types'

interface ChatDisplayProps {
  chat: ChatData
}

export function ChatDisplay({ chat }: ChatDisplayProps): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const { role, content } = chat
  const isUser = role === 'user'
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      paddingLeft={isUser ? SPACING.spacing40 : undefined}
      paddingRight={isUser ? undefined : SPACING.spacing40}
    >
      <StyledText>{isUser ? t('you') : t('opentronsai')}</StyledText>
      {/* text should be markdown so this component will have a package or function to parse markdown */}
      <Flex
        padding={SPACING.spacing32}
        backgroundColor={isUser ? COLORS.blue30 : COLORS.grey30}
        data-testid={`ChatDisplay_from_${isUser ? 'user' : 'backend'}`}
        borderRadius={BORDERS.borderRadius12}
        width="100%"
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
      >
        {/* ToDo (kk:05/02/2024) This part is waiting for Mel's design */}
        {/* <Markdown
          components={{
            div: undefined,
            ul: UnnumberedListText,
            h2: HeaderText,
            li: ListItemText,
            p: ParagraphText,
            a: ExternalLink,
            code: CodeText,
          }}
        >
          {content}
        </Markdown> */}
        <Markdown>{content}</Markdown>
      </Flex>
    </Flex>
  )
}

// ToDo (kk:05/02/2024) This part is waiting for Mel's design
// function ExternalLink(props: JSX.IntrinsicAttributes): JSX.Element {
//   return <a {...props} target="_blank" rel="noopener noreferrer" />
// }

// function ParagraphText(props: JSX.IntrinsicAttributes): JSX.Element {
//   return <StyledText {...props} as="p" />
// }

// function HeaderText(props: JSX.IntrinsicAttributes): JSX.Element {
//   return <StyledText {...props} as="h3" />
// }

// function ListItemText(props: JSX.IntrinsicAttributes): JSX.Element {
//   return <StyledText {...props} as="li" />
// }

// function UnnumberedListText(props: JSX.IntrinsicAttributes): JSX.Element {
//   return <StyledText {...props} as="ul" />
// }

const CODE_TEXT_STYLE = css`
  padding: ${SPACING.spacing16};
  font-family: monospace;
  color: ${COLORS.white};
  background-color: ${COLORS.black90};
`

function CodeText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <StyledText {...props} as="p" css={CODE_TEXT_STYLE} />
}
