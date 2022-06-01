import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { JUSTIFY_CENTER, Flex, SPACING } from '@opentrons/components'
import { ProceedToRunButton } from '../ProceedToRunButton'

interface SetupLiquidsProps {
  protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
}

export function SetupLiquids(props: SetupLiquidsProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')

  return (
    <Flex justifyContent={JUSTIFY_CENTER} marginTop={SPACING.spacing4}>
      <ProceedToRunButton
        protocolRunHeaderRef={props.protocolRunHeaderRef}
        robotName={props.robotName}
        runId={props.runId}
      />
    </Flex>
  )
}
