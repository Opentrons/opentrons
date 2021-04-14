// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'

import {
  THERMOCYCLER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  useSendModuleCommand,
  getMatchedModules,
  getModuleControlsDisabled,
} from '../../../../redux/modules'

import { TempDeckCard } from './TempDeckCard'
import { MagDeckCard } from './MagDeckCard'
import { ThermocyclerCard } from './ThermocyclerCard'

export const ModuleLiveStatusCards = (): React.Node => {
  const matchedModules = useSelector(getMatchedModules)
  const sendModuleCommand = useSendModuleCommand()
  const controlDisabledReason = useSelector(getModuleControlsDisabled)
  const [expandedCard, setExpandedCard] = React.useState(
    matchedModules.length > 0 ? matchedModules[0].module.serial : ''
  )
  const prevModuleCountRef = React.useRef<number>(matchedModules.length)
  React.useEffect(() => {
    if (prevModuleCountRef.current === 0 && matchedModules.length > 0) {
      setExpandedCard(matchedModules[0].module.serial)
    }
    prevModuleCountRef.current = matchedModules.length
  }, [matchedModules])

  const makeToggleCard = (serial: string) => () => {
    setExpandedCard(serial === expandedCard ? '' : serial)
  }

  if (matchedModules.length === 0) return null

  return (
    <>
      {matchedModules.map((m, index) => {
        switch (m.module.type) {
          case TEMPERATURE_MODULE_TYPE:
            return (
              <TempDeckCard
                key={m.module.serial}
                module={m.module}
                slot={m.slot}
                toggleCard={makeToggleCard(m.module.serial)}
                isCardExpanded={expandedCard === m.module.serial}
                sendModuleCommand={sendModuleCommand}
                controlDisabledReason={controlDisabledReason}
              />
            )
          case THERMOCYCLER_MODULE_TYPE:
            return (
              <ThermocyclerCard
                key={m.module.serial}
                module={m.module}
                slot={m.slot}
                toggleCard={makeToggleCard(m.module.serial)}
                isCardExpanded={expandedCard === m.module.serial}
                sendModuleCommand={sendModuleCommand}
                controlDisabledReason={controlDisabledReason}
              />
            )
          case MAGNETIC_MODULE_TYPE:
            return (
              <MagDeckCard
                key={m.module.serial}
                module={m.module}
                slot={m.slot}
                toggleCard={makeToggleCard(m.module.serial)}
                isCardExpanded={expandedCard === m.module.serial}
                sendModuleCommand={sendModuleCommand}
                controlDisabledReason={controlDisabledReason}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}
