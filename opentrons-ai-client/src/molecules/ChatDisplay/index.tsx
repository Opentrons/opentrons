import { useState } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import Markdown from 'react-markdown'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  JUSTIFY_FLEX_START,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { ChatData } from '../../resources/types'

interface ChatDisplayProps {
  chat: ChatData
  chatId: string
}

export function ChatDisplay({ chat, chatId }: ChatDisplayProps): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const [isCopied, setIsCopied] = useState<boolean>(false)
  const { role, reply } = chat
  const isUser = role === 'user'

  const handleClickCopy = async (): Promise<void> => {
    const lastCodeBlock = document.querySelector(`#${chatId}`)
    const code = lastCodeBlock?.textContent ?? ''
    await navigator.clipboard.writeText(code)
    setIsCopied(true)
  }

  function CodeText(props: JSX.IntrinsicAttributes): JSX.Element {
    return <CodeWrapper {...props} id={chatId} />
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      paddingLeft={isUser ? SPACING.spacing40 : undefined}
      paddingRight={isUser ? undefined : SPACING.spacing40}
    >
      <Flex justifyContent={isUser ? JUSTIFY_FLEX_END : JUSTIFY_FLEX_START}>
        <LegacyStyledText>
          {isUser ? t('you') : t('opentronsai')}
        </LegacyStyledText>
      </Flex>
      {/* text should be markdown so this component will have a package or function to parse markdown */}
      <Flex
        padding={SPACING.spacing32}
        backgroundColor={isUser ? COLORS.blue30 : COLORS.grey30}
        data-testid={`ChatDisplay_from_${isUser ? 'user' : 'backend'}`}
        borderRadius={BORDERS.borderRadius12}
        width="100%"
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        position={POSITION_RELATIVE}
      >
        <Markdown
          components={{
            div: undefined,
            ul: UnnumberedListText,
            h2: HeaderText,
            li: ListItemText,
            p: ParagraphText,
            a: isUser ? ParagraphText : ExternalLink,
            code: CodeText,
          }}
        >
          {reply}
        </Markdown>

        {!isUser ? (
          <PrimaryButton
            position={POSITION_ABSOLUTE}
            right={SPACING.spacing16}
            bottom={`-${SPACING.spacing24}`}
            borderRadius={BORDERS.borderRadiusFull}
            onClick={handleClickCopy}
          >
            <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_CENTER}>
              <Icon
                size="2rem"
                name={isCopied ? 'check' : 'copy-text'}
                color={COLORS.white}
              />
            </Flex>
          </PrimaryButton>
        ) : null}
      </Flex>
    </Flex>
  )
}

// Note (05/08/2024) the following styles are temp
function ExternalLink(props: JSX.IntrinsicAttributes): JSX.Element {
  return <a {...props} target="_blank" rel="noopener noreferrer" />
}

function ParagraphText(props: JSX.IntrinsicAttributes): JSX.Element {
  return (
    <LegacyStyledText
      {...props}
      fontSize={TYPOGRAPHY.fontSize20}
      lineHeight={TYPOGRAPHY.lineHeight24}
    />
  )
}

function HeaderText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <LegacyStyledText {...props} as="h3" />
}

function ListItemText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <LegacyStyledText {...props} as="li" marginLeft={SPACING.spacing16} />
}

function UnnumberedListText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <LegacyStyledText {...props} as="ul" />
}

const CodeWrapper = styled(Flex)`
  display: inline-flex;
  font-family: monospace;
  padding: ${SPACING.spacing4};
  color: ${COLORS.black80};
  background-color: ${COLORS.grey20};
  border-radius: ${BORDERS.borderRadius4};
  overflow: auto;
  border: 1px solid ${COLORS.blue35};
`
