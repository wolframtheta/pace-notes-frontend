# Pins al Mapa - Rally Pace Notes

## Nova Funcionalitat Implementada ✅

S'ha afegit la visualització de pins al mapa per a cada nota de pilot (corba o recta) generada.

## Característiques dels Pins

### Colors dels Pins

Cada tipus de nota té un color diferent per facilitar la identificació visual:

- 🔴 **Vermell**: Corbes a l'Esquerra
- 🟠 **Taronja**: Corbes a la Dreta  
- 🟢 **Verd**: Rectes

### Informació dels Pins

Cada pin mostra un popup al fer-hi clic amb la següent informació:

- **Número de posició** i **etiqueta** de la nota
- **Tipus** (Corba Esquerra/Dreta o Recta)
- **Angle** (per corbes) o **Distància** (per rectes)
- **Text personalitzat** (si n'hi ha)

## On es Mostren els Pins?

### 1. Editor de Tram (`/stage-editor`)

Quan analitzes una ruta:
1. Clica waypoints al mapa
2. Prem **"Analitzar"**
3. Els pins apareixen automàticament sobre la ruta
4. Una llegenda mostra el significat de cada color a la cantonada superior dreta

### 2. Detall del Tram (`/stages/:id`)

Quan visualitzes un tram guardat:
- Es mostra un mapa amb la ruta traçada
- Tots els pins de les notes es visualitzen
- Llegenda de colors al costat del títol del mapa
- Pots fer clic a cada pin per veure la informació detallada

## Implementació Tècnica

### MapService - Mètodes Nous

```typescript
// Afegir pins de notes al mapa
addNoteMarkers(notes: PaceNote[]): void

// Esborrar tots els pins de notes
clearNoteMarkers(): void
```

### Flux d'Ús

1. **Anàlisi de Ruta** → Genera notes amb coordenades (lat, lng)
2. **MapService.addNoteMarkers()** → Crea un marker de Leaflet per cada nota
3. **Color segons tipus** → Vermell (corba E), Taronja (corba D), Verd (recta)
4. **Popup amb info** → Cada marker té un popup amb detalls de la nota

### Icones Utilitzades

S'utilitzen els markers de colors de [leaflet-color-markers](https://github.com/pointhi/leaflet-color-markers):
- `marker-icon-2x-red.png` → Corbes esquerra
- `marker-icon-2x-orange.png` → Corbes dreta
- `marker-icon-2x-green.png` → Rectes

## Exemple Visual

```
Mapa amb Ruta
├── Pin Vermell (#1) → "6E" - Corba 25° Esquerra
├── Pin Verd (#2) → "120m" - Recta 120 metres
├── Pin Taronja (#3) → "4D" - Corba 75° Dreta
└── Pin Verd (#4) → "80m" - Recta 80 metres
```

## Beneficis

✅ **Visualització intuïtiva** - Veure on són les corbes i rectes al mapa
✅ **Identificació ràpida** - Colors diferents per cada tipus
✅ **Informació contextual** - Popup amb tots els detalls
✅ **Navegació fàcil** - Zoom i pan al mapa per explorar
✅ **Llegenda clara** - Sempre visible per recordar els colors

## Fitxers Modificats

- `src/app/features/stage-editor/services/map.service.ts`
- `src/app/features/stage-editor/stage-editor.component.ts`
- `src/app/features/stages/components/stage-detail/stage-detail.component.ts`

## Estat

- ✅ Build exitós
- ✅ Pins funcionant a l'editor
- ✅ Pins funcionant al detall de tram
- ✅ Popups amb informació completa
- ✅ Llegenda de colors
- ✅ Colors diferents per tipus de nota

Ara pots visualitzar clarament on són les corbes i rectes al mapa! 🎉
