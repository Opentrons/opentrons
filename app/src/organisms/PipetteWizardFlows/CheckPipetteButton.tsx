import * as React from 'react'
import { usePipettesQuery } from '@opentrons/react-api-client'
import { PrimaryButton } from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons/OnDeviceDisplay'

interface CheckPipetteButtonProps {
  proceedButtonText: string
  setFetching: React.Dispatch<React.SetStateAction<boolean>>
  isFetching: boolean
  proceed: () => void
  isOnDevice: boolean | null
}
export const CheckPipetteButton = (
  props: CheckPipetteButtonProps
): JSX.Element => {
  const {
    proceedButtonText,
    proceed,
    setFetching,
    isFetching,
    isOnDevice,
  } = props
  const { refetch } = usePipettesQuery(
    { refresh: true },
    {
      enabled: false,
      onSettled: () => {
        setFetching(false)
      },
    }
  )

  return isOnDevice ? (
    <SmallButton
      disabled={isFetching}
      buttonText={proceedButtonText}
      buttonType="default"
      onClick={() => {
        setFetching(true)
        refetch()
          .then(() => {
            proceed()
          })
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
