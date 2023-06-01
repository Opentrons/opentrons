import * as React from 'react'
import { useHistory } from 'react-router-dom'

import {
  getGripperDisplayName,
  getPipetteModelSpecs,
  GripperModel,
  LEFT,
  NINETY_SIX_CHANNEL,
  PipetteModel,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import { ChoosePipette } from '../PipetteWizardFlows/ChoosePipette'
import { FLOWS } from '../PipetteWizardFlows/constants'
import { PipetteWizardFlows } from '../PipetteWizardFlows'
import { GripperWizardFlows } from '../GripperWizardFlows'
import { GRIPPER_FLOW_TYPES } from '../GripperWizardFlows/constants'
import { useMaintenanceRunTakeover } from '../TakeoverModal'
import { LabeledMount } from './LabeledMount'
import type { InstrumentData } from '@opentrons/api-client'
import type { Mount } from '../../redux/pipettes/types'
import type { SelectablePipettes } from '../PipetteWizardFlows/types'

interface AttachedInstrumentMountItemProps {
  mount: Mount | 'extension'
  attachedInstrument: InstrumentData | null
  setWizardProps: (
    props:
      | React.ComponentProps<typeof GripperWizardFlows>
      | React.ComponentProps<typeof PipetteWizardFlows>
      | null
  ) => void
}

export function AttachedInstrumentMountItem(
  props: AttachedInstrumentMountItemProps
): JSX.Element {
  const history = useHistory()
  const { mount, attachedInstrument, setWizardProps } = props

  const [showChoosePipetteModal, setShowChoosePipetteModal] = React.useState(
    false
  )
  const [
    selectedPipette,
    setSelectedPipette,
  ] = React.useState<SelectablePipettes>(SINGLE_MOUNT_PIPETTES)
  const { setODDMaintenanceFlowInProgress } = useMaintenanceRunTakeover()

  const handleClick: React.MouseEventHandler = () => {
    if (attachedInstrument == null && mount !== 'extension') {
      setShowChoosePipetteModal(true)
    } else if (attachedInstrument == null && mount === 'extension') {
      setWizardProps({
        flowType: GRIPPER_FLOW_TYPES.ATTACH,
        attachedGripper: attachedInstrument,
        closeFlow: () => setWizardProps(null),
      })
      setODDMaintenanceFlowInProgress()
    } else {
      history.push(`/instruments/${mount}`)
    }
  }

  const displayName =
    attachedInstrument?.mount !== 'extension'
      ? getPipetteModelSpecs(
          attachedInstrument?.instrumentModel as PipetteModel
        )?.displayName
      : getGripperDisplayName(
          attachedInstrument?.instrumentModel as GripperModel
        )
  return (
    <>
      <LabeledMount
        mount={mount}
        instrumentName={displayName ?? null}
        handleClick={handleClick}
      />
      {showChoosePipetteModal ? (
        <ChoosePipette
          proceed={() => {
            setWizardProps({
              mount:
                selectedPipette === NINETY_SIX_CHANNEL
                  ? LEFT
                  : (mount as Mount),
              flowType: FLOWS.ATTACH,
              selectedPipette,
              closeFlow: () => {
                setWizardProps(null)
                setSelectedPipette(SINGLE_MOUNT_PIPETTES)
                setShowChoosePipetteModal(false)
              },
              onComplete: () => {
                history.push(`/instruments/${mount}`)
              },
            })
            setODDMaintenanceFlowInProgress()
            setShowChoosePipetteModal(false)
          }}
          setSelectedPipette={setSelectedPipette}
          selectedPipette={selectedPipette}
          exit={() => {
            setShowChoosePipetteModal(false)
          }}
          mount={mount as Mount}
        />
      ) : null}
    </>
  )
}
