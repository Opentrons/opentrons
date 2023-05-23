import * as React from 'react'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { PrimaryButton } from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons'

interface CheckPipetteButtonProps {
  proceedButtonText: string
  setFetching: React.Dispatch<React.SetStateAction<boolean>>
  isFetching: boolean
  isOnDevice: boolean | null
  proceed?: () => void
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
  const { refetch } = useInstrumentsQuery({
    enabled: false,
    onSettled: () => {
      setFetching(false)
    },
  })

  return isOnDevice ? (
    <SmallButton
      disabled={isFetching}
      buttonText={proceedButtonText}
      buttonType="primary"
      onClick={() => {
        setFetching(true)
        refetch()
          .then(() => {
            proceed?.()
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
            proceed?.()
          })
          .catch(() => {})
      }}
    >
      {proceedButtonText}
    </PrimaryButton>
  )
}
