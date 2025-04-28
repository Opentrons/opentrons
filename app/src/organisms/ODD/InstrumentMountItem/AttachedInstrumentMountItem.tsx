import type { InstrumentData } from '@opentrons/api-client'
import { SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'
import type { GripperModel, PipetteModel } from '@opentrons/shared-data'
import {
  useGripperDisplayName,
  usePipetteModelSpecs,
} from '/app/local-resources/instruments'
import type { GripperWizardFlows } from '/app/organisms/GripperWizardFlows'
import { GRIPPER_FLOW_TYPES } from '/app/organisms/GripperWizardFlows/constants'
import type { PipetteWizardFlows } from '/app/organisms/PipetteWizardFlows'
import { ChoosePipette } from '/app/organisms/PipetteWizardFlows/ChoosePipette'
import { FLOWS } from '/app/organisms/PipetteWizardFlows/constants'
import type { SelectablePipettes } from '/app/organisms/PipetteWizardFlows/types'
import type { Mount } from '/app/redux/pipettes/types'
import { useState } from 'react'
import type { ComponentProps, MouseEventHandler } from 'react'
import { useNavigate } from 'react-router-dom'
import { LabeledMount } from './LabeledMount'

interface AttachedInstrumentMountItemProps {
  mount: Mount | 'extension'
  attachedInstrument: InstrumentData | null
  setWizardProps: (
    props:
      | ComponentProps<typeof GripperWizardFlows>
      | ComponentProps<typeof PipetteWizardFlows>
      | null
  ) => void
}

export function AttachedInstrumentMountItem(
  props: AttachedInstrumentMountItemProps
): JSX.Element {
  const navigate = useNavigate()
  const { mount, attachedInstrument, setWizardProps } = props

  const [showChoosePipetteModal, setShowChoosePipetteModal] = useState(false)
  const [selectedPipette, setSelectedPipette] = useState<SelectablePipettes>(
    SINGLE_MOUNT_PIPETTES
  )

  const handleClick: MouseEventHandler = () => {
    if (attachedInstrument == null && mount !== 'extension') {
      setShowChoosePipetteModal(true)
    } else if (attachedInstrument == null && mount === 'extension') {
      setWizardProps({
        flowType: GRIPPER_FLOW_TYPES.ATTACH,
        attachedGripper: attachedInstrument,
        onComplete: () => {
          navigate(
            attachedInstrument == null ? '/instruments' : `/instrument/${mount}`
          )
        },
        closeFlow: () => {
          setWizardProps(null)
        },
      })
    } else {
      navigate(`/instruments/${mount}`)
    }
  }

  const instrumentModel = attachedInstrument?.ok
    ? attachedInstrument.instrumentModel
    : null

  const pipetteDisplayName =
    usePipetteModelSpecs(instrumentModel as PipetteModel)?.displayName ?? null
  const gripperDisplayName = useGripperDisplayName(
    instrumentModel as GripperModel
  )

  const displayName =
    attachedInstrument?.ok && attachedInstrument?.mount === 'extension'
      ? gripperDisplayName
      : pipetteDisplayName

  return (
    <>
      <LabeledMount
        mount={mount}
        instrumentName={displayName}
        handleClick={handleClick}
      />
      {showChoosePipetteModal ? (
        <ChoosePipette
          proceed={() => {
            setWizardProps({
              mount: mount as Mount,
              flowType: FLOWS.ATTACH,
              selectedPipette,
              closeFlow: () => {
                setWizardProps(null)
                setSelectedPipette(SINGLE_MOUNT_PIPETTES)
                setShowChoosePipetteModal(false)
              },
              onComplete: () => {
                navigate(
                  attachedInstrument == null
                    ? `/instruments`
                    : `/instrument/${mount}`
                )
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
