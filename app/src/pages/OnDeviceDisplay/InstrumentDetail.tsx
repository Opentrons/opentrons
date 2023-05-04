import { BackButton } from '../../atoms/buttons/BackButton'
import { InstrumentInfo } from '../../organisms/InstrumentInfo'
import type { InstrumentData } from '@opentrons/api-client'
import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import * as React from 'react'
import { useParams } from 'react-router-dom'

export const InstrumentDetail = (): JSX.Element => {
  const { mount } = useParams<{ mount: InstrumentData['mount'] }>()
  const { data: attachedInstruments } = useInstrumentsQuery()
  const instrument =
    (attachedInstruments?.data ?? []).find(i => i.mount === mount) ?? null
  return (
    <Flex
      padding={`${String(SPACING.spacing32)} ${String(
        SPACING.spacing40
      )} ${String(SPACING.spacing40)}`}
      flexDirection={DIRECTION_COLUMN}
      height="100%"
    >
      <BackButton>{instrument?.instrumentModel}</BackButton>
      {instrument != null ? <InstrumentInfo instrument={instrument} /> : null}
    </Flex>
  )
}
