import * as React from 'react'
import { AlertsModal } from '.'
import { useToaster } from '../ToasterOven'

export interface AlertsContextProps {
  removeActiveAppUpdateToast: () => void
}

export const AlertsContext = React.createContext<AlertsContextProps>({
  removeActiveAppUpdateToast: () => null,
})

interface AlertsProps {
  children: React.ReactNode
}

export function Alerts({ children }: AlertsProps): JSX.Element {
  const toastRef = React.useRef<string | null>(null)
  const { eatToast } = useToaster()

  const removeActiveAppUpdateToast = (): void => {
    if (toastRef.current) {
      eatToast(toastRef.current)
      toastRef.current = null
    }
  }

  return (
    <AlertsContext.Provider value={{ removeActiveAppUpdateToast }}>
      <AlertsModal toastIdRef={toastRef} />
      {children}
    </AlertsContext.Provider>
  )
}
