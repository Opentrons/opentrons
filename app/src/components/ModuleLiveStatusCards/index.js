// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'

import {
  getAttachedModulesForConnectedRobot,
  getModuleControlsDisabled,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  useSendModuleCommand,
} from '../../modules'
import { MagDeckCard } from './MagDeckCard'
import { TempDeckCard } from './TempDeckCard'
import { ThermocyclerCard } from './ThermocyclerCard'

export const ModuleLiveStatusCards = (): React.Node => {
  const modules = useSelector(getAttachedModulesForConnectedRobot)
  const sendModuleCommand = useSendModuleCommand()
  const controlDisabledReason = useSelector(getModuleControlsDisabled)
  const [expandedCard, setExpandedCard] = React.useState(
    modules.length > 0 ? modules[0].serial : ''
  )
  const prevModuleCountRef = React.useRef<number>(modules.length)
  React.useEffect(() => {
    if (prevModuleCountRef.current === 0 && modules.length > 0) {
      setExpandedCard(modules[0].serial)
    }
    prevModuleCountRef.current = modules.length
  }, [modules])

  const makeToggleCard = (serial: string) => () => {
    setExpandedCard(serial === expandedCard ? '' : serial)
  }

  if (modules.length === 0) return null

  return (
    <>
      {modules.map((module, index) => {
        switch (module.type) {
          case TEMPERATURE_MODULE_TYPE:
            return (
              <TempDeckCard
                key={module.serial}
                module={module}
                toggleCard={makeToggleCard(module.serial)}
                isCardExpanded={expandedCard === module.serial}
                sendModuleCommand={sendModuleCommand}
                controlDisabledReason={controlDisabledReason}
              />
            )
          case THERMOCYCLER_MODULE_TYPE:
            return (
              <ThermocyclerCard
                key={module.serial}
                module={module}
                toggleCard={makeToggleCard(module.serial)}
                isCardExpanded={expandedCard === module.serial}
                sendModuleCommand={sendModuleCommand}
                controlDisabledReason={controlDisabledReason}
              />
            )
          case MAGNETIC_MODULE_TYPE:
            return (
              <MagDeckCard
                key={module.serial}
                module={module}
                toggleCard={makeToggleCard(module.serial)}
                isCardExpanded={expandedCard === module.serial}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}
