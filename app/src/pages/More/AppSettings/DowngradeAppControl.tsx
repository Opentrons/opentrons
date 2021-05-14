import * as React from 'react'
import { C_BLUE, SPACING_2, Link, Text } from '@opentrons/components'
import { TitledControl } from '../../../atoms/TitledControl'

import type { StyleProps } from '@opentrons/components'

const PREVIOUS_RELEASES_URL = 'https://github.com/Opentrons/opentrons/releases'

// NOTE(mc, 2020-10-09): `en/` intentionally omitted from URL
const UNINSTALL_SUPPORT_URL =
  'https://support.opentrons.com/articles/2393514-uninstall-the-opentrons-app'

// TOOD(mc, 2020-10-08): i18n
const RESTORE_A_DIFFERENT_VERSION = 'Restore Different Software Version'

const NEED_TO_RESTORE = (
  <>
    Need to restore a different version of Opentrons OT-2 or App software? While
    Opentrons does not recommend to reverting to older software versions, you
    can access{' '}
    <Link external href={PREVIOUS_RELEASES_URL} color={C_BLUE}>
      previous releases here
    </Link>
    .
  </>
)

const PERFORM_A_FULL_UNINSTALL = (
  <>
    For best results,{' '}
    <Link external href={UNINSTALL_SUPPORT_URL} color={C_BLUE}>
      uninstall the existing app and remove its configuration files
    </Link>{' '}
    before installing the older version.
  </>
)

export function DowngradeAppControl(props: StyleProps): JSX.Element {
  return (
    <TitledControl
      {...props}
      title={RESTORE_A_DIFFERENT_VERSION}
      description={
        <>
          <Text marginBottom={SPACING_2}>{NEED_TO_RESTORE}</Text>
          <Text>{PERFORM_A_FULL_UNINSTALL}</Text>
        </>
      }
    />
  )
}
