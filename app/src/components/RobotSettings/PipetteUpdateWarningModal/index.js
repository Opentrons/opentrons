// @flow
import * as React from 'react'
import { AlertModal, OutlineButton, PrimaryButton } from '@opentrons/components'
import { Portal } from '../../portal'
import styles from './styles.css'

export type ToggleRef = { current: null | HTMLParagraphElement }

type Props = {
  id: string,
  set: (id: string, value: boolean) => mixed,
  toggleRef: ToggleRef,
}

const HEADING = 'Important: Pipette Calibration Update'

export default class PipetteUpdateWarningModal extends React.Component<Props> {
  close = () => this.props.set(this.props.id, false)

  goToAdvancedSettings = () => {
    const $toggle = this.props.toggleRef.current

    this.close()
    if ($toggle) $toggle.scrollIntoView()
  }

  render() {
    return (
      <Portal>
        <AlertModal
          heading={HEADING}
          contentsClassName={styles.contents}
          alertOverlay
        >
          <p>
            This release includes updated calibrations for the{' '}
            <strong>P10S</strong>, <strong>P10M</strong>, <strong>P50S</strong>,{' '}
            <strong>P50M</strong>, and <strong>P300S</strong> pipettes.
          </p>

          <p>
            This update is an incremental refinement to aspiration volume
            accuracy, reflecting extensive additional test data.{' '}
            <strong>
              Your robot is now configured to use these new calibrations.
            </strong>
          </p>

          <p>
            Please note this change may result in materially different
            aspiration volumes. If you do not wish to use the updated
            calibrations immediately (for example, if you are in the middle of
            an experimental run, or if you are already using a custom aspiration
            method), you can revert these changes by enabling{' '}
            <em>&quot;Use older pipette calibrations&quot;</em> in your
            robot&apos;s <em>&quot;Advanced Settings&quot;</em> menu.
          </p>
          <div className={styles.button_bar}>
            <OutlineButton
              onClick={this.goToAdvancedSettings}
              className={styles.button}
            >
              go to advanced settings
            </OutlineButton>
            <PrimaryButton onClick={this.close} className={styles.button}>
              ok
            </PrimaryButton>
          </div>
        </AlertModal>
      </Portal>
    )
  }
}
