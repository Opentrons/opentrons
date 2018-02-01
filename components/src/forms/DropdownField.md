When `value` prop is truthy, the "blank" option isn't shown:

```js
initialState = {selectedValue: 'rna'}

;<DropdownField
  onChange={e => setState({selectedValue: e.target.value})}
  value={state.selectedValue}
  options={[
    {name: 'DNA', value: 'dna'},
    {name: 'RNA', value: 'rna'},
    {name: 'Protein', value: 'protein'}
  ]}
/>
```

When `value` is falsey, the "blank" option appears and is selected. You can't get back to blank state once you're selected something without external state manipulation. This is similar to how `RadioGroup` works.

```js
initialState = {selectedValue: null}

;<div>
  <DropdownField
    onChange={e => setState({selectedValue: e.target.value})}
    value={state.selectedValue}
    options={[
      {name: 'DNA', value: 'dna'},
      {name: 'RNA', value: 'rna'},
      {name: 'Protein', value: 'protein'}
    ]}
  />
  <FlatButton onClick={e => setState({selectedValue: null})}>Click to Reset</FlatButton>
</div>
```

To make a `DropdownField` always allow the user to select a blank value, add an option object to the `options` prop with a blank (empty string) value:

```js
initialState = {selectedValue: ''}

;<DropdownField
  onChange={e => setState({selectedValue: e.target.value})}
  value={state.selectedValue}
  options={[
    {name: '', value: ''},
    {name: 'DNA', value: 'dna'},
    {name: 'RNA', value: 'rna'},
    {name: 'Protein', value: 'protein'}
  ]}
/>
```
