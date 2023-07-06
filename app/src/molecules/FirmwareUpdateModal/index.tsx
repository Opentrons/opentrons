import * as React from 'react'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  Flex,
  RESPONSIVENESS,
  JUSTIFY_CENTER,
  BORDERS,
  COLORS,
} from '@opentrons/components'
import {
  useInstrumentsQuery,
  useSubsystemUpdateQuery,
  useUpdateSubsystemMutation,
} from '@opentrons/react-api-client'
import { ProgressBar } from '../../atoms/ProgressBar'
import { StyledText } from '../../atoms/text'
import { BadGripper, BadPipette, Subsystem } from '@opentrons/api-client'

interface FirmwareUpdateModalProps {
  description: string
  proceed: () => void
  subsystem: Subsystem
}

const DESCRIPTION_STYLE = css`
  ${TYPOGRAPHY.h1Default}
  margin-top: ${SPACING.spacing8};
  margin-bottom: ${SPACING.spacing24};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-weight: ${TYPOGRAPHY.fontWeightBold};
    font-size: ${TYPOGRAPHY.fontSize32};
    margin-top: ${SPACING.spacing4};
    margin-bottom: ${SPACING.spacing32};
    margin-left: 4.5rem;
    margin-right: 4.5rem;
    text-align: ${TYPOGRAPHY.textAlignCenter};
    line-height: ${TYPOGRAPHY.lineHeight42};
  }
`
const MODAL_STYLE = css`
  align-items: ${ALIGN_CENTER};
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  padding: ${SPACING.spacing32};
  height: 24.625rem;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: 31.5625rem;
  }
`
const OUTER_STYLES = css`
  border-radius: ${BORDERS.borderRadiusSize4};
  background: ${COLORS.medGreyEnabled};
  width: 13.374rem;
`

export const FirmwareUpdateModal = (
  props: FirmwareUpdateModalProps
): JSX.Element => {
  const { proceed, subsystem, description } = props
  const [updateId, setUpdateId] = React.useState('')
  const {
    data: attachedInstruments,
    refetch: refetchInstruments,
  } = useInstrumentsQuery()
  const { updateSubsystem } = useUpdateSubsystemMutation({
    onSuccess: data => {
      setUpdateId(data.data.id)
    },
  })
  const updateNeeded =
    attachedInstruments?.data?.some(
      (i): i is BadGripper | BadPipette => !i.ok && i.subsystem === subsystem
    ) ?? false
  React.useEffect(() => {
    if (!updateNeeded) {
      proceed()
    } else {
      updateSubsystem(subsystem)
    }
  }, [])
  const { data: updateData } = useSubsystemUpdateQuery(updateId)
  const status = updateData?.data.updateStatus
  const percentComplete = updateData?.data.updateProgress ?? 0

  React.useEffect(() => {
    if (status === 'done') {
      refetchInstruments()
        .then(() => {
          proceed()
        })
        .catch(() => {
          proceed()
        })
    }
  }, [status, proceed, refetchInstruments])
  return (
    <Flex css={MODAL_STYLE}>
      <StyledText css={DESCRIPTION_STYLE}>{description}</StyledText>
      <ProgressBar
        percentComplete={percentComplete}
        outerStyles={OUTER_STYLES}
      />
    </Flex>
  )
}
