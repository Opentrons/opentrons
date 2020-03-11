// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'

import {
  THERMOCYCLER,
  TEMPDECK,
  MAGDECK,
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
  const isProtocolRunning: boolean = useSelector(robotSelectors.getIsRunning)
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
        switch (module.name) {
          case TEMPDECK:
            return (
              <TempDeckCard
                key={module.serial}
                module={module}
                toggleCard={makeToggleCard(module.serial)}
                isCardExpanded={expandedCard === module.serial}
                sendModuleCommand={sendModuleCommand}
                allowInteraction={!isProtocolRunning}
              />
            )
          case THERMOCYCLER:
            return (
              <ThermocyclerCard
                key={module.serial}
                module={module}
                toggleCard={makeToggleCard(module.serial)}
                isCardExpanded={expandedCard === module.serial}
                sendModuleCommand={sendModuleCommand}
                allowInteraction={!isProtocolRunning}
              />
            )
          case MAGDECK:
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
