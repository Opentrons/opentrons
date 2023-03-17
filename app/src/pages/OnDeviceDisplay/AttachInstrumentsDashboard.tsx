import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  RIGHT,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import {
  ALIGN_FLEX_END,
  Btn,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
} from '@opentrons/components'
import { useAttachedPipettes } from '../../organisms/Devices/hooks'
import { TertiaryButton } from '../../atoms/buttons'
import { FLOWS } from '../../organisms/PipetteWizardFlows/constants'
import { PipetteWizardFlows } from '../../organisms/PipetteWizardFlows'
import { ChoosePipette } from '../../organisms/PipetteWizardFlows/ChoosePipette'
import { getIs96ChannelPipetteAttached } from '../../organisms/Devices/utils'

import type {
  PipetteWizardFlow,
  SelectablePipettes,
} from '../../organisms/PipetteWizardFlows/types'
import type { Mount } from '../../redux/pipettes/types'

export const AttachInstrumentsDashboard = (): JSX.Element => {
  const [
    pipetteWizardFlow,
    setPipetteWizardFlow,
  ] = React.useState<PipetteWizardFlow | null>(null)
  const [mount, setMount] = React.useState<Mount>(LEFT)
  const [
    selectedPipette,
    setSelectedPipette,
  ] = React.useState<SelectablePipettes>(SINGLE_MOUNT_PIPETTES)
  const [showAttachPipette, setShowAttachPipette] = React.useState(false)
  const attachedPipettes = useAttachedPipettes()
  const isNinetySixChannelAttached = getIs96ChannelPipetteAttached(
    attachedPipettes.left ?? null
  )
  const handlePipette = (mount: Mount): void => {
    setMount(mount)
    switch (mount) {
      case LEFT: {
        if (attachedPipettes.left != null) {
          setPipetteWizardFlow(FLOWS.DETACH)
        } else {
          setShowAttachPipette(true)
        }
        break
      }
      case RIGHT: {
        if (attachedPipettes.right != null) {
          setPipetteWizardFlow(FLOWS.DETACH)
        } else {
          setShowAttachPipette(true)
        }
        break
      }
    }
  }
  const handleCalibrate = (mount: Mount): void => {
    setPipetteWizardFlow(FLOWS.CALIBRATE)
    setMount(mount)
  }
  const handleAttachPipette = (): void => {
    setShowAttachPipette(false)
    setPipetteWizardFlow(FLOWS.ATTACH)
  }
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex
        alignSelf={ALIGN_FLEX_END}
        marginTop={SPACING.spacing5}
        width="fit-content"
        paddingRight={SPACING.spacing6}
      >
        <Link to="menu">
          <TertiaryButton>To ODD Menu</TertiaryButton>
        </Link>
      </Flex>
      {showAttachPipette ? (
        <ChoosePipette
          proceed={handleAttachPipette}
          setSelectedPipette={setSelectedPipette}
          selectedPipette={selectedPipette}
          exit={() => setShowAttachPipette(false)}
          mount={mount}
        />
      ) : null}
      {pipetteWizardFlow != null ? (
        <PipetteWizardFlows
          flowType={pipetteWizardFlow}
          mount={
            //  hardcoding in LEFT mount for whenever a 96 channel is selected
            selectedPipette === NINETY_SIX_CHANNEL ? LEFT : mount
          }
          closeFlow={() => setPipetteWizardFlow(null)}
          selectedPipette={
            isNinetySixChannelAttached ? NINETY_SIX_CHANNEL : selectedPipette
          }
          setSelectedPipette={setSelectedPipette}
        />
      ) : null}
      {showAttachPipette || pipetteWizardFlow != null ? null : (
        <Flex
          gridGap={SPACING.spacing6}
          marginTop={SPACING.spacing6}
          flexDirection={DIRECTION_COLUMN}
        >
          <Btn onClick={() => handlePipette(LEFT)}>
            {attachedPipettes.left != null
              ? 'detach left pipette'
              : 'attach left pipette'}
          </Btn>
          {attachedPipettes.left != null ? (
            <Btn onClick={() => handleCalibrate(LEFT)}>
              {'calibrate left pipette'}
            </Btn>
          ) : null}
          <Btn onClick={() => handlePipette(RIGHT)}>
            {attachedPipettes.right != null
              ? 'detach right pipette'
              : 'attach right pipette'}
          </Btn>
          {attachedPipettes.right != null ? (
            <Btn onClick={() => handleCalibrate(RIGHT)}>
              {'calibrate right pipette'}
            </Btn>
          ) : null}
        </Flex>
      )}
    </Flex>
  )
}
