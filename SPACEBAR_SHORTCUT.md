# Drecera de Teclat: Barra Espaiadora

## Nova Funcionalitat Implementada ✅

Ara pots utilitzar la **barra espaiadora** com a drecera temporal per afegir waypoints sense haver de canviar de mode manualment.

## Com Funciona

### ⌨️ Mantenir Premuda la Barra Espaiadora

```
Estat Normal:     Mode Pan (moure mapa)
                       ↓
[Prem Space]      Mode Afegir Waypoint (cursor creu)
                       ↓
[Clic al mapa]    Afegeix waypoint
                       ↓
[Deixa Space]     Torna a Mode Pan automàticament
```

### Comportament Detallat

1. **Sense prémer res**: Mode Pan actiu
   - Pots moure el mapa lliurement
   - Cursor: mà

2. **Premeu i manteniu Space**: Canvia temporalment a Mode Afegir Waypoint
   - El cursor canvia a creu
   - Pots clicar per afegir waypoints
   - El botó "Afegir Waypoint" s'il·lumina en blau

3. **Deixeu Space**: Torna automàticament a Mode Pan
   - El cursor torna a mà
   - Pots tornar a moure el mapa

## Avantatges

✅ **Ràpid**: No cal clicar botons per canviar de mode
✅ **Intuïtiu**: Com moltes eines de disseny (Photoshop, Figma, etc.)
✅ **Eficient**: Afegeix múltiples waypoints ràpidament
✅ **No invasiu**: Només funciona quan NO estàs escrivint en un input

## Indicador Visual

Al toolbar hi ha un indicador que mostra la drecera:

```
┌─────────────────────────────────────┐
│ [🗺️ Moure] [📍 Afegir]              │
│ [Space] = Afegir temporalment       │
│ [🔙 Desfer] [🗑️ Esborrar]            │
└─────────────────────────────────────┘
```

## Protecció contra Escriptura Accidental

La funcionalitat **NO s'activa** quan estàs escrivint:
- ❌ En camps de text (`<input>`)
- ❌ En àrees de text (`<textarea>`)
- ❌ En elements amb `contenteditable`

Això evita que es canviï de mode mentre escrius el nom del tram o altres dades.

## Workflow Recomanat

### Opció 1: Barra Espaiadora (Ràpid)
```
1. Explora el mapa (Mode Pan)
2. Mantingues Space
3. Clica on vulguis afegir waypoints
4. Deixa Space
5. Repeteix quan necessitis afegir més punts
```

### Opció 2: Mode Permanent
```
1. Clica "Afegir Waypoint"
2. Clica múltiples punts consecutivament
3. Clica "Moure Mapa" quan acabis
```

## Implementació Tècnica

### Event Listeners
```typescript
// keydown: Canvia a mode afegir waypoint
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !isInputFocused()) {
    e.preventDefault(); // Evita scroll
    setMode('addWaypoint');
  }
});

// keyup: Torna a mode pan
document.addEventListener('keyup', (e) => {
  if (e.code === 'Space' && !isInputFocused()) {
    e.preventDefault();
    setMode('pan');
  }
});
```

### Cleanup
Els event listeners es netegen correctament quan es destrueix el component per evitar memory leaks.

## Casos d'Ús

### 1. Traçat Ràpid
Mantenir Space i clicar ràpidament diversos punts consecutius.

### 2. Exploració i Afegir
Explorar el mapa en mode pan, i només quan trobes el punt exacte, prémer Space i clicar.

### 3. Correccions Precises
Fer zoom a una zona, mantenir Space, afegir el waypoint precís, i continuar explorant.

## Compatibilitat

- ✅ **Chrome/Edge**: Funciona perfectament
- ✅ **Firefox**: Funciona perfectament
- ✅ **Safari**: Funciona perfectament
- ✅ **Teclats espanyols**: Barra espaiadora estàndard
- ✅ **Teclats catalans**: Barra espaiadora estàndard

## Nota Important

⚠️ Si cliques dins d'un camp de text (com "Nom del Tram"), la barra espaiadora escriurà un espai normalment. Aquest és el comportament esperat i desitjat.

## Fitxers Modificats

- ✅ `map.component.ts` - Event listeners per Space
- ✅ `map-toolbar.component.ts` - Indicador visual de la drecera

Ara pots treballar molt més ràpid! 🚀⌨️
