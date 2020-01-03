// @flow
import * as React from 'react'
import { useDispatch } from 'react-redux'
import {
  useTimeout,
  PrimaryButton,
  AlertModal,
  Icon,
} from '@opentrons/components'

import { sendModuleCommand } from '../../modules'
import DeckMap from '../DeckMap'
import styles from './styles.css'
import { Portal } from '../portal'
import { THERMOCYCLER } from '../../modules/constants'
import type { Dispatch } from '../../types'
import type { AttachedModule } from '../../modules/types'

const LID_OPEN_DELAY_MS = 30 * 1000
type Props = {| robotName: string, modules: Array<AttachedModule> |}

export function PrepareModules(props: Props) {
  const { modules, robotName } = props
  const dispatch = useDispatch<Dispatch>()
  const [isHandling, setIsHandling] = React.useState(false)

  // NOTE: this is the smarter implementation of isHandling that
  // relies on the TC reporting its 'in_between' status while the lid m
  // motor is moving, which currently doesn't happen because of a FW limitation
  // const isHandling = some(
  //   modules,
  //   mod => mod.name === 'thermocycler' && mod.data?.lid === 'in_between'
  // )

  useTimeout(() => setIsHandling(false), isHandling ? LID_OPEN_DELAY_MS : null)

  const handleOpenLidClick = () => {
    modules
      .filter(mod => mod.name === THERMOCYCLER)
      .forEach(mod =>
        dispatch(sendModuleCommand(robotName, mod.serial, 'open'))
      )
    setIsHandling(true)
  }

  return (
    <div className={styles.page_content_dark}>
      <div className={styles.deck_map_wrapper}>
        <DeckMap className={styles.deck_map} modulesRequired />
      </div>
      <Portal>
        <AlertModal
          iconName={null}
          heading="Open Thermocycler Module lid for calibration"
        >
          <p>
            The Thermocycler Module&apos;s lid is closed. Please open the lid in
            order to proceed with calibration.
          </p>
          <PrimaryButton
            className={styles.open_lid_button}
            onClick={handleOpenLidClick}
            disabled={isHandling}
          >
            {isHandling ? (
              <>
                <Icon
                  name="ot-spinner"
                  className={styles.in_progress_spinner}
                  spin
                />
              </>
            ) : (
              'Open Lid'
            )}
          </PrimaryButton>
        </AlertModal>
      </Portal>
    </div>
  )
}
