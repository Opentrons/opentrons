Basic usage:

```js
<FlatButton onClick={() => alert('you clicked me')}>
  {'Click me!'}
</FlatButton>
```

Disabled:

```js
<FlatButton onClick={() => alert("can't click me")} disabled>
  {"Can't click"}
</FlatButton>
```

With icon:

```js
<FlatButton onClick={() => alert('you clicked me')} iconName='flask'>
  {'Click me!'}
</FlatButton>
```

To create a flat button that's just a single icon, pass the `<Icon>` as a child. Do not use `iconName`, because `iconName`  positions the icon absolutely, which is probably not what you want. You should also:

*   Override the width of the flat button to `auto` (default is `9rem`)
*   Give the icon a specific size dimension
*   Set the icon to `display: block` for line-height reasons

```js
<FlatButton onClick={() => alert('you clicked me')} className='width-auto'>
  <Icon name='close' className='display-block width-3-rem'/>
</FlatButton>
```
