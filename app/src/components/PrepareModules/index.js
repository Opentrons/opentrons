// @flow
import * as React from 'react'
import { useDispatch } from 'react-redux'
import some from 'lodash/some'
import { PrimaryButton, AlertModal, Icon } from '@opentrons/components'

import { sendModuleCommand } from '../../modules'
import DeckMap from '../DeckMap'
import styles from './styles.css'
import { Portal } from '../portal'

import type { Dispatch } from '../../types'
import type { AttachedModule } from '../../modules/types'

const LID_OPEN_DELAY_MS = 30 * 1000
type Props = {| robotName: string, modules: Array<AttachedModule> |}

export function PrepareModules(props: Props) {
  const { modules, robotName } = props
  const dispatch = useDispatch<Dispatch>()
  const [isHandling, setIsHandling] = React.useState(false)

  const handleOpenLidClick = () => {
    modules
      .filter(mod => mod.name === 'thermocycler')
      .forEach(mod =>
        dispatch(sendModuleCommand(robotName, mod.serial, 'open'))
      )
    setIsHandling(true)
    setTimeout(() => setIsHandling(false), LID_OPEN_DELAY_MS)
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
