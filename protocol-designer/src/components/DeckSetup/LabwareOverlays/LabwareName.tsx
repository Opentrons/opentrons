import * as React from 'react'
import { useSelector } from 'react-redux'
import { LabwareNameOverlay, truncateString } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import { LabwareOnDeck } from '../../../step-forms'
interface LabwareNameProps {
  labwareOnDeck: LabwareOnDeck
}

export function LabwareName(props: LabwareNameProps): JSX.Element {
  const { labwareOnDeck } = props
  const nicknames = useSelector(uiLabwareSelectors.getLabwareNicknamesById)
  const nickname = nicknames[labwareOnDeck.id]
  const truncatedNickName =
    nickname != null ? truncateString(nickname, 75, 25) : null
  const title = truncatedNickName ?? getLabwareDisplayName(labwareOnDeck.def)
  return <LabwareNameOverlay title={title} />
}
