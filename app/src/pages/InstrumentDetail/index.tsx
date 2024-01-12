import * as React from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  getGripperDisplayName,
  getPipetteModelSpecs,
  GripperModel,
  PipetteModel,
} from '@opentrons/shared-data'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import {
  Icon,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LEGACY_COLORS,
  RESPONSIVENESS,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'

import { BackButton } from '../../atoms/buttons/BackButton'
import { InstrumentInfo } from '../../organisms/InstrumentInfo'
import { handleInstrumentDetailOverflowMenu } from '../../pages/InstrumentDetail/InstrumentDetailOverflowMenu'
import { ODD_FOCUS_VISIBLE } from '../../atoms/buttons/constants'

import type { GripperData, PipetteData } from '@opentrons/api-client'

export const InstrumentDetail = (): JSX.Element => {
  const { mount } = useParams<{ mount: PipetteData['mount'] }>()
  const { data: attachedInstruments } = useInstrumentsQuery()
  const instrument =
    (attachedInstruments?.data ?? []).find(
      (i): i is PipetteData | GripperData => i.ok && i.mount === mount
    ) ?? null

  const displayName =
    instrument?.mount !== 'extension'
      ? getPipetteModelSpecs(instrument?.instrumentModel as PipetteModel)
          ?.displayName
      : getGripperDisplayName(instrument?.instrumentModel as GripperModel)

  return (
    <>
      <Flex
        padding={`${SPACING.spacing32} ${SPACING.spacing40} ${SPACING.spacing40}`}
        flexDirection={DIRECTION_COLUMN}
        height="100%"
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <BackButton>{displayName}</BackButton>
          {instrument?.ok && instrument?.mount !== 'extension' ? (
            <Flex marginTop={`-${SPACING.spacing16}`}>
              <IconButton
                aria-label="overflow menu button"
                onClick={() => handleInstrumentDetailOverflowMenu(instrument)}
              >
                <Icon
                  name="overflow-btn-touchscreen"
                  height="3.75rem"
                  width="3rem"
                  color={COLORS.grey60}
                />
              </IconButton>
            </Flex>
          ) : null}
        </Flex>
        <InstrumentInfo instrument={instrument} />
      </Flex>
    </>
  )
}

const IconButton = styled('button')`
  border-radius: ${SPACING.spacing4};
  max-height: 100%;
  background-color: ${COLORS.white};

  &:active {
    background-color: ${LEGACY_COLORS.darkBlack20};
  }
  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${LEGACY_COLORS.darkBlack20};
  }
  &:disabled {
    background-color: transparent;
  }
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    cursor: default;
  }
`
