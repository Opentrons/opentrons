This component uses the `react-select` library. So the change/blur events are not
normal DOM events, but special ones. To make the difference clear, `PipetteSelect`
doesn't have `onChange` and `onBlur` but instead `onPipetteChange`.

```js
const [state, setState] = React.useState({ pipetteName: null })
;<PipetteSelect
  onPipetteChange={pipetteName => {
    console.log(pipetteName)
    setState({ pipetteName })
  }}
  pipetteName={state.pipetteName}
  nameBlacklist={['p20_multi_gen2', 'p300_multi_gen2']}
/>
```

Allow "None" as the default option

```js
const [state, setState] = React.useState({ pipetteName: null })
;<PipetteSelect
  onPipetteChange={pipetteName => {
    console.log(pipetteName)
    setState({ pipetteName })
  }}
  pipetteName={state.pipetteName}
  enableNoneOption
/>
```
