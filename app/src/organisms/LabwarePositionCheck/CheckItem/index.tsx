import * as React from 'react'
import { DIRECTION_COLUMN, Flex } from '@opentrons/components'
import { PrepareSpace } from './PrepareSpace'
import { JogToWell } from './JogToWell'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { CheckTipRacksStep } from '../types'

interface CheckItemProps extends Omit<CheckTipRacksStep, 'section'> {
  runId: string
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
}
export const CheckItem = (props: CheckItemProps): JSX.Element | null => {
  const {labwareId, pipetteId, location} = props
  const [hasPreparedSpace, setHasPreparedSpace] = React.useState(false)
  React.useEffect(() => {
    console.log('EFFECT CALLED')
    setHasPreparedSpace(false)
  }, [labwareId, pipetteId, location?.moduleId, location?.slotName])
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      {hasPreparedSpace ? (
        <JogToWell {...props} goBack={() => setHasPreparedSpace(false)}/>
      ) : (
        <PrepareSpace {...props} confirmPlacement={() => setHasPreparedSpace(true)}/>
      )}
    </Flex>
  )
}
