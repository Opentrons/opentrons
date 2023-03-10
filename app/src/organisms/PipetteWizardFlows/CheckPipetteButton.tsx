import * as React from 'react'
import { usePipettesQuery } from '@opentrons/react-api-client'
import { PrimaryButton } from '../../atoms/buttons'
import { SmallButton } from '../../atoms/buttons/OnDeviceDisplay'

interface CheckPipetteButtonProps {
  proceedButtonText: string
  setFetching: React.Dispatch<React.SetStateAction<boolean>>
  proceed: () => void
  isOnDevice: boolean | null
}
export const CheckPipetteButton = (
  props: CheckPipetteButtonProps
): JSX.Element => {
  const { proceedButtonText, proceed, setFetching, isOnDevice } = props
  const { refetch, isFetching } = usePipettesQuery(
    { refresh: true },
    {
      enabled: false,
      onSettled: () => {
        setPending(false)
      },
      onSettled: () => {
        setFetching(false)
      },
    }
  )

  React.useEffect(() => {
    setFetching(isFetching)
  }, [isFetching, setFetching])

  return isOnDevice != null && isOnDevice ? (
    <SmallButton
      disabled={isFetching}
      buttonText={proceedButtonText}
      buttonType="default"
      onClick={() => {
        refetch()
          .then(() => {})
          .catch(() => {})
      }}
    />
  ) : (
    <PrimaryButton
      disabled={isFetching}
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
