# Desktop icons — final set

| File | Project | Colour |
|---|---|---|
| `futee.svg` | Futee | `#F2E338` |
| `emf.svg` | EMF — ACE | `#E4BC6B` |
| `cseds.svg` | CSEDS | `#6C9BDA` + `#FBF7F0` + `#D2543C` |
| `into-yesterday.svg` | Into Yesterday | `#F2B15A` wax + `#E0722C` ember |

`sprite.svg` holds all four as `<symbol>`s (`#icon-futee`, `#icon-emf`,
`#icon-cseds`, `#icon-into-yesterday`). Paste it once near the top of `<body>`,
then `<svg viewBox="0 0 32 32"><use href="#icon-futee"/></svg>`.

`png/` has 104px and 208px transparent exports if you need raster.

Futee and Into Yesterday take their colour from `currentColor`, so `color:` on
the parent sets them. CSEDS and the ember line in the maze are hard-coded.

Each icon carries its own dark keyline, so it does not need the black square:

```css
.folder svg{
  width:52px;height:52px;
  filter:drop-shadow(0 3px 0 rgba(0,0,0,.45)) drop-shadow(0 6px 14px rgba(0,0,0,.35));
}
```
