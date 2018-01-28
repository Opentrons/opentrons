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
