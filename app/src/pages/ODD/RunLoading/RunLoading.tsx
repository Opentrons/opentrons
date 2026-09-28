import { useNavigate } from 'react-router-dom'

import { ProtocolSetupFullSkeleton } from '/app/organisms/ODD/ProtocolSetup'
import { ProtocolSetupLoadingTimeoutModal } from '/app/organisms/ODD/ProtocolSetup/ProtocolSetupLoadingTimeoutModal'

import type { ReactNode } from 'react'

export function RunLoading(): ReactNode {
  const navigate = useNavigate()

  return (
    <>
      <ProtocolSetupLoadingTimeoutModal
        onReturnToDashboard={() => {
          navigate('/dashboard')
        }}
      />
      <ProtocolSetupFullSkeleton />
    </>
  )
}
