// @flow
// info panel for labware calibration page
import { AlertModal, PrimaryButton, SpinnerModal } from '@opentrons/components'
import { push } from 'connected-react-router'
import some from 'lodash/some'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import pcrSealSrc from '../../img/place_pcr_seal.png'
import { getModuleType, THERMOCYCLER_MODULE_TYPE } from '../../modules'
import { selectors as robotSelectors } from '../../robot'
import type { Dispatch } from '../../types'
import { Portal } from '../portal'
import styles from './styles.css'

const IS_HOMING_MESSAGE = 'Returning tip and homing robot'

export type ProceedToRunProps = {|
  returnTip: () => mixed,
|}

export function ProceedToRun(props: ProceedToRunProps): React.Node {
  const { returnTip } = props
  const dispatch = useDispatch<Dispatch>()
  const sessionModules = useSelector(robotSelectors.getModules)
  const inProgress = useSelector(robotSelectors.getReturnTipInProgress)
  const [mustPrepForRun, setMustPrepForRun] = React.useState(false)
  const [runPrepModalOpen, setRunPrepModalOpen] = React.useState(false)

  React.useEffect(() => {
    if (
      some(
        sessionModules,
        mod => getModuleType(mod.model) === THERMOCYCLER_MODULE_TYPE
      )
    ) {
      setMustPrepForRun(true)
    }
  }, [sessionModules])

  const handleClick = () => {
    returnTip()
    if (mustPrepForRun) {
      setRunPrepModalOpen(true)
    } else {
      dispatch(push(`/run`))
    }
  }

  return (
    <>
      <PrimaryButton className={styles.info_box_button} onClick={handleClick}>
        return tip and proceed to run
      </PrimaryButton>
      {runPrepModalOpen && (
        <Portal>
          {inProgress ? (
            <SpinnerModal message={IS_HOMING_MESSAGE} />
          ) : (
            <AlertModal
              alertOverlay
              iconName={null}
              heading="Place PCR seal on Thermocycler"
            >
              <span className={styles.place_seal_instructions}>
                Place rubber PCR seal on lid of Thermocycler Module
              </span>
              <p className={styles.secure_latch_explanation}>
                Doing this prior to the run enables a tight seal to reduce
                evaporation.
              </p>
              <div className={styles.modal_image_wrapper}>
                <img
                  src={pcrSealSrc}
                  className={styles.place_seal_image}
                  alt="place rubber PCR seal on lid of Thermocycler Module"
                />
              </div>
              <PrimaryButton
                className={styles.open_lid_button}
                onClick={() => {
                  dispatch(push(`/run`))
                }}
              >
                Confirm PCR Seal is in place
              </PrimaryButton>
            </AlertModal>
          )}
        </Portal>
      )}
    </>
  )
}
