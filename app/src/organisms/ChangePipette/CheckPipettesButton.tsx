import * as React from 'react'
import { usePipettesQuery } from '@opentrons/react-api-client'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import {
  Icon,
  DIRECTION_ROW,
  Flex,
  LEGACY_COLORS,
  ALIGN_CENTER,
  SPACING,
  SIZE_1,
  PrimaryButton,
} from '@opentrons/components'
import { DETACH } from './constants'

export interface CheckPipetteButtonProps {
  robotName: string
  children?: React.ReactNode
  direction?: 'detach' | 'attach'
  onDone?: () => void
}

export function CheckPipettesButton(
  props: CheckPipetteButtonProps
): JSX.Element | null {
  const { onDone, children, direction } = props
  const { t } = useTranslation('change_pipette')
  const [isPending, setIsPending] = React.useState(false)
  const { refetch: refetchPipettes } = usePipettesQuery(
    { refresh: true },
    {
      enabled: false,
      onSettled: () => {
        setIsPending(false)
      },
    }
  )
  const handleClick = (): void => {
    setIsPending(true)
    refetchPipettes()
      .then(() => {
        onDone?.()
      })
      .catch(() => {})
  }
  const icon = (
    <Icon name="ot-spinner" height="1rem" spin marginRight={SPACING.spacing8} />
  )

  let body
  if (children != null && !isPending) {
    body = children
  } else if (children != null && isPending) {
    body = (
      <>
        {icon}
        {children}
      </>
    )
  } else if (children == null && isPending) {
    body = (
      <>
        <Icon
          name="ot-spinner"
          height={SIZE_1}
          spin
          marginRight={SPACING.spacing8}
        />
        <StyledText>
          {direction === DETACH
            ? t('confirming_detachment')
            : t('confirming_attachment')}
        </StyledText>
      </>
    )
  } else if (children == null && !isPending) {
    body =
      direction === DETACH ? t('confirm_detachment') : t('confirm_attachment')
  }

  return (
    <PrimaryButton
      onClick={handleClick}
      aria-label="Confirm"
      disabled={isPending}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        color={COLORS.white}
        alignItems={ALIGN_CENTER}
      >
        {body}
      </Flex>
    </PrimaryButton>
  )
}
