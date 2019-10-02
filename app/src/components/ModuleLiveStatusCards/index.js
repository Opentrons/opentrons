// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'

import { getConnectedRobot } from '../../discovery'
import { getModulesState, type Module } from '../../robot-api'
import { selectors as robotSelectors } from '../../robot'

import type { Robot } from '../../discovery'

import useSendModuleCommand from '../ModuleControls/useSendModuleCommand'
import TempDeckCard from './TempDeckCard'
import MagDeckCard from './MagDeckCard'
import ThermocyclerCard from './ThermocyclerCard'

const ModuleLiveStatusCards = () => {
  const robot: ?Robot = useSelector(getConnectedRobot)
  const modules: Array<Module> = useSelector(state =>
    robot ? getModulesState(state, robot.name) : []
  )
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
  })

  const makeToggleCard = (serial: string) => () => {
    setExpandedCard(serial === expandedCard ? '' : serial)
  }

  if (modules.length === 0) return null

  return (
    <>
      {modules.map((module, index) => {
        switch (module.name) {
          case 'tempdeck':
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
          case 'thermocycler':
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
          case 'magdeck':
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

export default ModuleLiveStatusCards
