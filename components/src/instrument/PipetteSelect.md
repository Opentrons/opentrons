This component uses the `react-select` library. So the change/blur events are not
normal DOM events, but special ones. To make the difference clear, `SelectField`
doesn't have `onChange` and `onBlur` but instead `onValueChange` and `onLoseFocus`.

```js
initialState = { selectedValue: null }
;<div style={{ paddingBottom: '10rem' }}>
  {/* Add some space because options menu does not behave well when overlapping with styleguidist's code blocks! */}
  <PipetteSelect
    onPipetteChange={selectedValue => {
      console.log(selectedValue)
      setState({ selectedValue })
    }}
    value={state.selectedValue}
    nameBlacklist={['p20_multi_gen2', 'p300_multi_gen2']}
  />
</div>
```

Allow "None" as the default option

```js
initialState = { selectedValue: null }
;<div style={{ paddingBottom: '10rem' }}>
  {/* Add some space because options menu does not behave well when overlapping with styleguidist's code blocks! */}
  <PipetteSelect
    onPipetteChange={selectedValue => {
      console.log(selectedValue)
      setState({ selectedValue })
    }}
    value={state.selectedValue}
    enableNoneOption
  />
</div>
```
