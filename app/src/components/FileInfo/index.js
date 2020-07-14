// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import filter from 'lodash/filter'
import every from 'lodash/every'
import countBy from 'lodash/countBy'
import keyBy from 'lodash/keyBy'

// TODO(mc, 2018-09-13): these aren't cards; rename
import { InformationCard } from './InformationCard'
import { ProtocolPipettesCard } from './ProtocolPipettesCard'
import { ProtocolModulesCard } from './ProtocolModulesCard'
import { ProtocolLabwareCard } from './ProtocolLabwareCard'
import { Continue } from './Continue'
import { UploadError } from '../UploadError'
import styles from './styles.css'

import { selectors as robotSelectors } from '../../robot'
import { labware as labwareFunctions } from '../../calibration'

import type { State, Dispatch } from '../../types'

import type { Robot } from '../../discovery/types'

const NO_STEPS_MESSAGE = `This protocol has no steps in it - there's nothing for your robot to do! Your protocol needs at least one aspirate/dispense to import properly`

export type FileInfoProps = {|
  robot: Robot,
  sessionLoaded: boolean,
  sessionHasSteps: boolean,
  uploadError: ?{ message: string },
|}

export function FileInfo(props: FileInfoProps): React.Node {
  const dispatch = useDispatch<Dispatch>()
  const { robot, sessionLoaded, sessionHasSteps } = props
  const { name: robotName } = robot
  React.useEffect(() => {
    dispatch(labwareFunctions.fetchAllLabwareCalibrations(robotName))
  }, [dispatch, robotName])
  let uploadError = props.uploadError

  const labware = useSelector((state: State) =>
    robotSelectors.getLabware(state)
  )

  const labwareCalibrations = useSelector((state: State) =>
    labwareFunctions.getListOfLabwareCalibrations(state, robotName)
  )

  if (sessionLoaded && !uploadError && !sessionHasSteps) {
    uploadError = { message: NO_STEPS_MESSAGE }
  }
  const labwareCount = countBy(labware, 'type')

  const calibrations = filter(labwareCalibrations, function(l) {
    return Object.keys(labwareCount).includes(l?.attributes.loadName)
  })

  const calibrationLoadNamesMap = keyBy(calibrations, function(labwareObject) {
    return labwareObject?.attributes.loadName
  })

  const allLabwareCalibrated = every(Object.keys(labwareCount), function(a) {
    return Object.keys(calibrationLoadNamesMap).includes(a)
  })

  return (
    <div className={styles.file_info_container}>
      <InformationCard />
      <ProtocolPipettesCard robotName={robot.name} />
      <ProtocolModulesCard robot={robot} />
      <ProtocolLabwareCard
        labware={labwareCount}
        labwareCalibrations={calibrationLoadNamesMap}
      />
      {uploadError && <UploadError uploadError={uploadError} />}
      {sessionLoaded && !uploadError && (
        <Continue labwareCalibrated={allLabwareCalibrated} />
      )}
    </div>
  )
}
