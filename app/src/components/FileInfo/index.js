// @flow
import * as React from 'react'
import { useTranslation } from 'react-i18next'

// TODO(mc, 2018-09-13): these aren't cards; rename
import { Box, OVERFLOW_AUTO, SPACING_4, SPACING_2 } from '@opentrons/components'
import { InformationCard } from './InformationCard'
import { ProtocolPipettesCard } from './ProtocolPipettesCard'
import { ProtocolModulesCard } from './ProtocolModulesCard'
import { ProtocolLabwareCard } from './ProtocolLabwareCard'
import { Continue } from './Continue'
import { UploadError } from '../UploadError'

import type { Robot } from '../../redux/discovery/types'

export type FileInfoProps = {|
  robot: Robot,
  sessionLoaded: boolean,
  sessionHasSteps: boolean,
  uploadError: ?{ message: string },
|}

export function FileInfo(props: FileInfoProps): React.Node {
  const { robot, sessionLoaded, sessionHasSteps } = props
  const { t } = useTranslation('protocol_info')
  let uploadError = props.uploadError

  if (sessionLoaded && !uploadError && !sessionHasSteps) {
    uploadError = { message: t('error_message_no_steps') }
  }

  return (
    <Box
      overflowY={OVERFLOW_AUTO}
      paddingX={`calc(${SPACING_4} - ${SPACING_2})`}
      paddingBottom={SPACING_2}
    >
      <InformationCard />
      <ProtocolPipettesCard robotName={robot.name} />
      <ProtocolModulesCard />
      {sessionLoaded && <ProtocolLabwareCard robotName={robot.name} />}
      {uploadError && <UploadError uploadError={uploadError} />}
      {sessionLoaded && !uploadError && <Continue />}
    </Box>
  )
}
