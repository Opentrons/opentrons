// @flow
import * as React from 'react'
import {AlertModal, OutlineButton, PrimaryButton} from '@opentrons/components'
import {Portal} from '../../portal'
import styles from './styles.css'

export type ToggleRef = {current: null | HTMLParagraphElement}

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

  render () {
    return (
      <Portal>
        <AlertModal
          heading={HEADING}
          contentsClassName={styles.contents}
          alertOverlay
        >
          <p>
            This release includes an update to the default aspiration behavior
            of the <strong>P10S</strong>, <strong>P10M</strong>,{' '}
            <strong>P50S</strong>, <strong>P50M</strong>, and{' '}
            <strong>P300S</strong> pipettes. The update refines the{' '}
            {"pipettes' "}
            µl-to-mm calibrations to incrementally improve their accuracy.
          </p>

          <p>
            This change results in materially different aspiration volumes. The
            volumes will be <strong>more accurate</strong>, but a change to
            pipetting behavior may not be immediately desirable for some users.
          </p>

          <ul>
            <li>
              If you are in the middle of an experimental run where <em>any</em>{' '}
              change in aspiration volumes would be detrimental...
            </li>
            <li>
              If you have made manual adjustments to your {"robot's"} software
              or protocols to adjust for inaccuracy...
            </li>
          </ul>

          <p>
            ...you may want to consider reverting the calibration change until
            you are ready to make the switch.
          </p>

          <p>
            <strong>
              Your robot is configured to use these new calibrations.
            </strong>{' '}
            However, if you prefer to use the previous µl-to-mm settings, you
            can revert by enabling {'"Use older pipette calibrations"'} in your{' '}
            {"robot's"} {'"Advanced Settings"'} menu. Please reach out to our
            team with any questions.
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
