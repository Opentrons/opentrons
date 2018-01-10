```js
<TitledList
  title='TitledList With Icon'
  onClick={e => window.alert('You clicked the title')}
  iconName='flask'
>
  <ListItem>Something 1</ListItem>
  <ListItem>Something 2</ListItem>
</TitledList>
```

Selected:

```js
<TitledList
  title='Selected TitledList'
  selected
>
  <ListItem>Something 1</ListItem>
  <ListItem>Something 2</ListItem>
</TitledList>
```

#### If `onCollapseToggle` prop is given a function, the TitledList will be collapsible.

##### Expanded:

```js
<TitledList
  title='Collapsible TitledList'
  onClick={e => window.alert('You clicked the title')}
  onCollapseToggle={e => window.alert('You clicked collapse/expand')}
>
  <ListItem>Something 1</ListItem>
  <ListItem>Something 2</ListItem>
</TitledList>
```

##### Collapsed:

```js
<TitledList
  title='Collapsible TitledList'
  onClick={e => window.alert('You clicked the title')}
  onCollapseToggle={e => window.alert('You clicked collapse/expand')}
  collapsed
>
  <ListItem>Something 1</ListItem>
  <ListItem>Something 2</ListItem>
</TitledList>
```
