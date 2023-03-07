import * as React from 'react'
import { PrimaryButton } from '../../atoms/buttons'
import { usePipettesQuery } from '@opentrons/react-api-client'

interface CheckPipetteButtonProps {
  proceedButtonText: string
  setPending: React.Dispatch<React.SetStateAction<boolean>>
  proceed: () => void
  isDisabled: boolean
}
export const CheckPipetteButton = (
  props: CheckPipetteButtonProps
): JSX.Element => {
  const { proceedButtonText, proceed, setPending, isDisabled } = props
  const { refetch } = usePipettesQuery(
    { refresh: true },
    {
      enabled: false,
      onSuccess: () => {
        proceed()
      },
      onSettled: () => {
        setPending(false)
      },
    }
  )

  return (
    <PrimaryButton
      disabled={isDisabled}
      onClick={() => {
        setPending(true)
        refetch()
          .then(() => {})
          .catch(() => {})
      }}
    >
      {proceedButtonText}
    </PrimaryButton>
  )
}
