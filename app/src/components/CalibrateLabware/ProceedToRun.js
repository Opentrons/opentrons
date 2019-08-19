// @flow
// info panel for labware calibration page
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { push } from 'connected-react-router'
import { PrimaryButton } from '@opentrons/components'

import { selectors as robotSelectors } from '../../robot'
import type { Dispatch } from '../../types'
import styles from './styles.css'

type Props = {|
  returnTip: () => mixed,
|}

function InfoBoxButton(props: Props) {
  const { returnTip } = props
  const dispatch = useDispatch<Dispatch>()
  const sessionModules = useSelector(robotSelectors.getModules)

  const [mustPrepForRun, setMustPrepForRun] = useState(
    some(sessionModules, mod => mod.name === 'thermocycler')
  )

  const handleClick = () => {
      // $FlowFixMe: robotActions.returnTip is not typed
      returnTip()
      dispatch(push(`/run`))
    }
  }

  return (
    <>
      <PrimaryButton
        className={styles.info_box_button}
        onClick={handleClick}
      >
        return tip and proceed to run
      </PrimaryButton>
      {mustPrepForRun && (
        <Portal>
          <AlertModal
            iconName={null}
            heading="Place PCR seal on Thermocycler"
          >
            <span className={styles.secure_latch_instructions}>
              Place rubber PCR seal on lid of Thermocycler Module
            </span>
            <p className={styles.secure_latch_explanation}>
              Doing this prior to the run enables a tight seal to reduce evaporation.
            </p>
            <div className={styles.modal_image_wrapper}>
              <img
                src={pcrSealSrc}
                className={styles.pcr_seal_image}
                alt="place rubber PCR seal on lid of Thermocycler Module"
              />
            </div>
            <PrimaryButton
              className={styles.open_lid_button}
              onClick={() => {setMustPrepForRun(false)}}
            >
              Confirm PCR Seal is in place
            </PrimaryButton>
          </AlertModal>
        </Portal>
      )}
    </>
  )
}

export default InfoBoxButton
