// @flow
import * as React from 'react'
import { useDispatch } from 'react-redux'
import some from 'lodash/some'
import { PrimaryButton, AlertModal, Icon } from '@opentrons/components'

import { sendModuleCommand, type Module, type RobotHost } from '../../robot-api'
import type { Dispatch } from '../../types'
import DeckMap from '../DeckMap'
import styles from './styles.css'
import { Portal } from '../portal'

type Props = {| robot: RobotHost, modules: Array<Module> |}

function PrepareModules(props: Props) {
  const { modules, robot } = props
  const dispatch = useDispatch<Dispatch>()

  const handleOpenLidClick = () => {
    modules
      .filter(mod => mod.name === 'thermocycler')
      .forEach(
        mod =>
          robot &&
          dispatch(
            sendModuleCommand(robot, mod.serial, { command_type: 'open' })
          )
      )
  }

  const isHandling = some(
    modules,
    mod => mod.name === 'thermocycler' && mod.data?.lid === 'in_between'
  )
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
            // disabled={isHandling}  TODO: uncomment when optical latches report 'closed'
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

export default PrepareModules
