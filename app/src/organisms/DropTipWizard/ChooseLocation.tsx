import * as React from "react"
import { useTranslation } from 'react-i18next'
import { DeckLocationSelect } from "@opentrons/components"
import { FLEX_ROBOT_TYPE, LabwareLocation, getDeckDefFromRobotType } from "@opentrons/shared-data"
import { WizardPane } from "./WizardPane"

const DEFAULT_LOCATION: LabwareLocation = {slotName: 'D1'}

interface ChooseLocationProps {
  proceed: () => void
}
export function ChooseLocation(props: ChooseLocationProps): JSX.Element {
  const { proceed } = props
  const { t, i18n } = useTranslation('robot_controls')
  const deckDef = React.useMemo(() => getDeckDefFromRobotType(FLEX_ROBOT_TYPE), [])
  const [selectedLocation, setSelectedLocation] = React.useState(DEFAULT_LOCATION)

  return (
    <WizardPane proceed={proceed} proceedButtonText={i18n.format(t('confirm_location'), 'capitalize')}>
      <DeckLocationSelect {...{deckDef, selectedLocation, setSelectedLocation}}/>
    </WizardPane>
  )
}