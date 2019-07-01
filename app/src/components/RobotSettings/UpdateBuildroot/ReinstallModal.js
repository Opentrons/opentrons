// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'
import { AlertModal } from '@opentrons/components'
import VersionList from './VersionList'
import type { VersionProps } from './types'
import styles from './styles.css'

type Props = {
  versionProps: VersionProps,
  parentUrl: string,
  update: () => mixed,
}

const HEADING = 'Robot Server is up to date'
const REINSTALL_MESSAGE =
  "It looks like your robot is already up to date, but if you're experiencing issues you can re-apply the latest update."

export default function ReinstallModal(props: Props) {
  const { parentUrl, update, versionProps } = props
  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        { Component: Link, to: parentUrl, children: 'not now' },
        { onClick: update, children: 'Reinstall', disabled: true },
      ]}
      alertOverlay
    >
      <p className={styles.reinstall_message}>{REINSTALL_MESSAGE}</p>
      <VersionList {...versionProps} ignoreAppUpdate />
    </AlertModal>
  )
}
