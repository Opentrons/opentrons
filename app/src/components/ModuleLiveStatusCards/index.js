// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'

import {
  THERMOCYCLER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  useSendModuleCommand,
  getAttachedModulesForConnectedRobot,
} from '../../modules'
import { selectors as robotSelectors } from '../../robot'
import { TempDeckCard } from './TempDeckCard'
import { MagDeckCard } from './MagDeckCard'
import { ThermocyclerCard } from './ThermocyclerCard'

export const ModuleLiveStatusCards = () => {
  const modules = useSelector(getAttachedModulesForConnectedRobot)
  const sendModuleCommand = useSendModuleCommand()
  const isProtocolActive: boolean = useSelector(robotSelectors.getIsActive)
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
                isProtocolActive={isProtocolActive}
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
                isProtocolActive={isProtocolActive}
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
