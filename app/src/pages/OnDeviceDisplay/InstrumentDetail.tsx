import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { ALIGN_FLEX_END, DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { TertiaryButton } from '../../atoms/buttons'
import type { InstrumentData } from '@opentrons/api-client'
import { BackButton } from '../../atoms/buttons/BackButton'
import { InstrumentInfo } from '../../organisms/InstrumentInfo.tsx'

export const InstrumentDetail = (): JSX.Element => {
  const { mount } = useParams<{ mount: InstrumentData['mount'] }>()
  const { data: attachedInstruments } = useInstrumentsQuery()
  const instrument = (attachedInstruments?.data ?? []).find(i => i.mount === mount) ?? null
  return (
    <Flex
      padding={`${String(SPACING.spacing6)} ${String(
        SPACING.spacingXXL
      )} ${String(SPACING.spacingXXL)}`}
      flexDirection={DIRECTION_COLUMN}
      height="100%"
    >
      <BackButton>{instrument?.instrumentModel}</BackButton>
      {instrument != null
        ? <InstrumentInfo instrument={instrument} />
        : null
      }
      <Flex
        alignSelf={ALIGN_FLEX_END}
        marginTop={SPACING.spacing5}
        width="fit-content"
        paddingRight={SPACING.spacing6}
      >
        <Link to="/menu">
          <TertiaryButton>To ODD Menu</TertiaryButton>
        </Link>
      </Flex>
    </Flex>
  )
}
