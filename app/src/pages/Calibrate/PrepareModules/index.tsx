import * as React from 'react'
import { useDispatch } from 'react-redux'
import {
  useTimeout,
  PrimaryButton,
  AlertModal,
  Icon,
} from '@opentrons/components'

import {
  THERMOCYCLER_MODULE_TYPE,
  sendModuleCommand,
  getModuleType,
} from '../../../redux/modules'
import { DeckMap } from '../../../molecules/DeckMap'
import { Portal } from '../../../App/portal'
import styles from './styles.css'

import type { Dispatch } from '../../../redux/types'
import type { AttachedModule } from '../../../redux/modules/types'

const LID_OPEN_DELAY_MS = 30 * 1000
interface Props {
  robotName: string
  modules: AttachedModule[]
}

export function PrepareModules(props: Props): JSX.Element {
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

  const handleOpenLidClick = (): void => {
    modules
      .filter(mod => getModuleType(mod.model) === THERMOCYCLER_MODULE_TYPE)
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
