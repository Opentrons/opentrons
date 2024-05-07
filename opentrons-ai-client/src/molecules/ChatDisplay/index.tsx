import React from 'react'
import styled, { css } from 'styled-components'
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
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { ChatData } from '../../resources/types'

interface ChatDisplayProps {
  chat: ChatData
}

export function ChatDisplay({ chat }: ChatDisplayProps): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const [isCopied, setIsCopied] = React.useState<boolean>(false)
  const { role, content } = chat
  const isUser = role === 'user'

  const handleClickCopy = async (): Promise<void> => {
    const lastCodeBlock = document.querySelectorAll('pre')[0]
    const code = (lastCodeBlock.innerText || lastCodeBlock.textContent) ?? ''
    await navigator.clipboard.writeText(code)
    setIsCopied(true)
  }

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
        position={POSITION_RELATIVE}
      >
        {/* ToDo (kk:05/02/2024) This part is waiting for Mel's design */}
        <Markdown
          components={{
            div: undefined,
            ul: UnnumberedListText,
            h2: HeaderText,
            li: ListItemText,
            p: ParagraphText,
            a: ExternalLink,
            code: Code,
          }}
        >
          {content}
        </Markdown>
        {role === 'assistant' ? (
          <PrimaryButton
            position={POSITION_ABSOLUTE}
            right="2rem"
            bottom="2rem"
            borderRadius={BORDERS.borderRadiusFull}
            onClick={handleClickCopy}
          >
            <Flex
              padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
              gridGap={SPACING.spacing8}
              alignItems={ALIGN_CENTER}
              justifyContent={JUSTIFY_CENTER}
            >
              <Icon
                size="2rem"
                name={isCopied ? 'check' : 'copy-text'}
                color={COLORS.white}
              />
              <StyledText
                fontSize={TYPOGRAPHY.fontSize22}
                lineHeight={TYPOGRAPHY.lineHeight28}
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {t('copy_code')}
              </StyledText>
            </Flex>
          </PrimaryButton>
        ) : null}
      </Flex>
    </Flex>
  )
}

// ToDo (kk:05/02/2024) This part is waiting for Mel's design
function ExternalLink(props: JSX.IntrinsicAttributes): JSX.Element {
  return <a {...props} target="_blank" rel="noopener noreferrer" />
}

function ParagraphText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <StyledText {...props} as="p" />
}

function HeaderText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <StyledText {...props} as="h3" />
}

function ListItemText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <StyledText {...props} as="li" />
}

function UnnumberedListText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <StyledText {...props} as="ul" />
}

const CodeText = styled.code`
  font-family: monospace;
  color: ${COLORS.white};
  background-color: ${COLORS.black90};
`

function Code(props: JSX.IntrinsicAttributes): JSX.Element {
  return (
    <Flex
      backgroundColor={COLORS.black90}
      padding={SPACING.spacing16}
      borderRadius={BORDERS.borderRadius8}
      marginBottom={SPACING.spacing32}
    >
      <CodeText {...props} />
    </Flex>
  )
}
