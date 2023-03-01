import * as React from 'react'
import { TYPOGRAPHY, SPACING } from '@opentrons/components'
import { usePipettesQuery } from '@opentrons/react-api-client'
import { PrimaryButton } from '../../atoms/buttons'
import { SmallButton } from '../../atoms/buttons/ODD'
import { StyledText } from '../../atoms/text'

interface CheckPipetteButtonProps {
  proceedButtonText: string
  setPending: React.Dispatch<React.SetStateAction<boolean>>
  proceed: () => void
  isDisabled: boolean
  isOnDevice: boolean | null
}
export const CheckPipetteButton = (
  props: CheckPipetteButtonProps
): JSX.Element => {
  const {
    proceedButtonText,
    proceed,
    setPending,
    isDisabled,
    isOnDevice,
  } = props
  const { refetch, isFetching } = usePipettesQuery(
    { refresh: true },
    {
      enabled: false,
      onSettled: () => {
        setPending(false)
      },
    }
  )

  React.useEffect(() => {
    setPending(isFetching)
  }, [isFetching, setPending])

  return isOnDevice != null && isOnDevice ? (
    <SmallButton
      aria-label="SmallButton"
      disabled={isDisabled}
      onClick={() => {
        refetch()
          .then(() => {})
          .catch(() => {})
      }}
    >
      <StyledText
        fontSize="1.375rem"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        padding={SPACING.spacing4}
      >
        {proceedButtonText}
      </StyledText>
    </SmallButton>
  ) : (
    <PrimaryButton
      disabled={isDisabled}
      onClick={() => {
        refetch()
          .then(() => {
            proceed()
          })
          .catch(() => {})
      }}
    >
      {proceedButtonText}
    </PrimaryButton>
  )
}
