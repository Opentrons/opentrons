import { useContext, createContext } from 'react'

// this context is used to trigger an LPC success toast render from an LPC component lower in the tree
export const LPCSuccessToastContext = createContext<{
  setIsShowingLPCSuccessToast: (isShowing: boolean) => void
}>({ setIsShowingLPCSuccessToast: () => null })

export function useLPCSuccessToast(): {
  setIsShowingLPCSuccessToast: (isShowing: boolean) => void
} {
  const { setIsShowingLPCSuccessToast } = useContext(LPCSuccessToastContext)
  return { setIsShowingLPCSuccessToast }
}
