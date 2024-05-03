import React from 'react'

export const promptContext = React.createContext<string>('')
export const setPromptContext = React.createContext<
  React.Dispatch<React.SetStateAction<string>>
>(() => undefined)

interface PromptProviderProps {
  children: React.ReactNode
}

export function PromptProvider({
  children,
}: PromptProviderProps): React.ReactElement {
  const [prompt, setPrompt] = React.useState<string>('')

  return (
    <promptContext.Provider value={prompt}>
      <setPromptContext.Provider value={setPrompt}>
        {children}
      </setPromptContext.Provider>
    </promptContext.Provider>
  )
}
