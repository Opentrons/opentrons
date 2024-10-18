import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { createPortal } from 'react-dom'

import { useInstrumentsQuery, useHost } from '@opentrons/react-api-client'
import {
  COLORS,
  CURSOR_DEFAULT,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  RESPONSIVENESS,
  SPACING,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE, getPipetteModelSpecs } from '@opentrons/shared-data'

import { BackButton } from '/app/atoms/buttons/BackButton'
import { ODD_FOCUS_VISIBLE } from '/app/atoms/buttons/constants'
import { InstrumentInfo } from '/app/organisms/ODD/InstrumentInfo'
import { handleInstrumentDetailOverflowMenu } from './InstrumentDetailOverflowMenu'
import {
  useGripperDisplayName,
  usePipetteModelSpecs,
} from '/app/local-resources/instruments'
import {
  DropTipWizardFlows,
  useDropTipWizardFlows,
} from '/app/organisms/DropTipWizardFlows'
import { getTopPortalEl } from '/app/App/portal'

import type { GripperData, PipetteData } from '@opentrons/api-client'
import type { GripperModel, PipetteModel } from '@opentrons/shared-data'

export const InstrumentDetail = (): JSX.Element => {
  const host = useHost()
  const { mount } = useParams<{ mount: PipetteData['mount'] }>()
  const { data: attachedInstruments } = useInstrumentsQuery()
  const instrument =
    (attachedInstruments?.data ?? []).find(
      (i): i is PipetteData | GripperData => i.ok && i.mount === mount
    ) ?? null

  const pipetteDisplayName = usePipetteModelSpecs(
    instrument?.instrumentModel as PipetteModel
  )?.displayName
  const gripperDisplayName = useGripperDisplayName(
    instrument?.instrumentModel as GripperModel
  )
  const { showDTWiz, disableDTWiz, enableDTWiz } = useDropTipWizardFlows()
  const pipetteModelSpecs =
    instrument != null
      ? getPipetteModelSpecs((instrument as PipetteData).instrumentModel) ??
        null
      : null

  const displayName =
    instrument?.mount !== 'extension' ? pipetteDisplayName : gripperDisplayName

  return (
    <>
      {showDTWiz &&
      instrument != null &&
      instrument?.mount !== 'extension' &&
      pipetteModelSpecs != null
        ? createPortal(
            <DropTipWizardFlows
              robotType={FLEX_ROBOT_TYPE}
              mount={instrument.mount}
              instrumentModelSpecs={pipetteModelSpecs}
              closeFlow={disableDTWiz}
              modalStyle="simple"
            />,
            getTopPortalEl()
          )
        : null}
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
                onClick={() => {
                  handleInstrumentDetailOverflowMenu(
                    instrument,
                    host,
                    enableDTWiz
                  )
                }}
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
    background-color: ${COLORS.grey35};
  }
  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${COLORS.grey35};
  }
  &:disabled {
    background-color: transparent;
  }
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    cursor: ${CURSOR_DEFAULT};
  }
`
