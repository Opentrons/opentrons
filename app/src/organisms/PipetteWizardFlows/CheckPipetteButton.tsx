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

  return (
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
