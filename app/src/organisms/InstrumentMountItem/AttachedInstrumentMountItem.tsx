import type { Mount } from '../../redux/pipettes/types'
import { GripperWizardFlows } from '../GripperWizardFlows'
import { GRIPPER_FLOW_TYPES } from '../GripperWizardFlows/constants'
import { PipetteWizardFlows } from '../PipetteWizardFlows'
import { ChoosePipette } from '../PipetteWizardFlows/ChoosePipette'
import { FLOWS } from '../PipetteWizardFlows/constants'
import type { SelectablePipettes } from '../PipetteWizardFlows/types'
import { LabeledMount } from './LabeledMount'
import type { InstrumentData } from '@opentrons/api-client'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import * as React from 'react'
import { useHistory } from 'react-router-dom'

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

  const handleClick: React.MouseEventHandler = () => {
    if (attachedInstrument == null && mount !== 'extension') {
      setShowChoosePipetteModal(true)
    } else if (attachedInstrument == null && mount === 'extension') {
      setWizardProps({
        flowType: GRIPPER_FLOW_TYPES.ATTACH,
        attachedGripper: attachedInstrument,
        closeFlow: () => setWizardProps(null),
      })
    } else {
      history.push(`/instruments/${mount}`)
    }
  }
  return (
    <>
      <LabeledMount
        mount={mount}
        instrumentName={attachedInstrument?.instrumentModel ?? null}
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
              setSelectedPipette,
              closeFlow: () => {
                setWizardProps(null)
                setShowChoosePipetteModal(false)
              },
            })
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
