import * as React from 'react'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  Flex,
  Icon,
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
  proceedDescription: string
  proceed: () => void
  subsystem: Subsystem
  isOnDevice: boolean
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
  background: ${COLORS.grey30};
  width: 13.374rem;
`

const SPINNER_STYLE = css`
  color: ${COLORS.grey50};
  opacity: 100%;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    color: ${COLORS.darkBlackEnabled};
    opacity: 70%;
  }
`

export const FirmwareUpdateModal = (
  props: FirmwareUpdateModalProps
): JSX.Element => {
  const {
    proceed,
    proceedDescription,
    subsystem,
    description,
    isOnDevice,
  } = props
  const [updateId, setUpdateId] = React.useState<string | null>(null)
  const [firmwareText, setFirmwareText] = React.useState('')
  const {
    data: attachedInstruments,
    refetch: refetchInstruments,
  } = useInstrumentsQuery({ refetchInterval: 5000 })
  const { updateSubsystem } = useUpdateSubsystemMutation({
    onSuccess: data => {
      setUpdateId(data.data.id)
    },
  })
  const instrumentToUpdate = attachedInstruments?.data?.find(
    i => i.subsystem === subsystem
  )
  const updateNeeded =
    attachedInstruments?.data?.some(
      (i): i is BadGripper | BadPipette => !i.ok && i.subsystem === subsystem
    ) ?? false

  React.useEffect(() => {
    setTimeout(() => {
      if (!updateNeeded) {
        setFirmwareText(proceedDescription)
        setTimeout(() => {
          proceed()
        }, 2000)
      } else {
        updateSubsystem(subsystem)
      }
    }, 2000)
  }, [])
  const { data: updateData } = useSubsystemUpdateQuery(updateId)
  const status = updateData?.data.updateStatus
  const percentComplete = updateData?.data.updateProgress ?? 0

  React.useEffect(() => {
    if ((status != null || updateNeeded) && firmwareText !== description) {
      setFirmwareText(description)
    }
    if (status === 'done') {
      refetchInstruments()
        .then(() => {
          if (instrumentToUpdate?.ok === true) proceed()
          else {
            // if the instrument doesn't appear ok when the update is done, wait 10sec and try again
            setTimeout(() => {
              proceed()
            }, 10000)
          }
        })
        .catch(error => {
          console.error(error.message)
          // even if the refetch fails, we should proceed as the next screen will handle the error
          proceed()
        })
    }
  }, [status, proceed, refetchInstruments, instrumentToUpdate, updateNeeded])

  return (
    <Flex css={MODAL_STYLE}>
      <StyledText css={DESCRIPTION_STYLE}>
        {firmwareText.length ? firmwareText : 'Checking for updates...'}
      </StyledText>
      {status != null || updateNeeded ? (
        <ProgressBar
          percentComplete={percentComplete}
          outerStyles={OUTER_STYLES}
        />
      ) : null}
      {firmwareText.length ? null : (
        <Icon
          name="ot-spinner"
          aria-label="spinner"
          size={isOnDevice ? '6.25rem' : '5.125rem'}
          css={SPINNER_STYLE}
          spin
        />
      )}
    </Flex>
  )
}
