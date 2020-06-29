// @flow
// app info card with version and updated
import {
  Card,
  LabeledValue,
  OutlineButton,
  useMountEffect,
} from '@opentrons/components'
import * as React from 'react'
import { Link } from 'react-router-dom'

import { CURRENT_VERSION } from '../../shell'
import { CardContentHalf } from '../layout'
import styles from './styles.css'

export type AppInfoCardProps = {|
  availableVersion: ?string,
  checkUpdate: () => void,
|}

const TITLE = 'Information'
const VERSION_LABEL = 'Software Version'

const UPDATE_AVAILABLE = 'view available update'
const UPDATE_NOT_AVAILABLE = 'up to date'

export function AppInfoCard(props: AppInfoCardProps): React.Node {
  const { checkUpdate, availableVersion } = props

  useMountEffect(checkUpdate)

  return (
    <Card title={TITLE}>
      <CardContentHalf>
        <LabeledValue label={VERSION_LABEL} value={CURRENT_VERSION} />
      </CardContentHalf>
      <CardContentHalf>
        <OutlineButton
          Component={Link}
          to="/menu/app/update"
          disabled={!availableVersion}
          className={styles.show_update_button}
        >
          {availableVersion ? UPDATE_AVAILABLE : UPDATE_NOT_AVAILABLE}
        </OutlineButton>
      </CardContentHalf>
    </Card>
  )
}
