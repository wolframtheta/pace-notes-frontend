# Sistema d'Eines del Mapa

## Nova Funcionalitat Implementada ✅

S'ha afegit un sistema d'eines per controlar la interacció amb el mapa.

## Modes Disponibles

### 🖐️ Mode Moure Mapa (Pan)
- **Per defecte**: El mapa inicia en aquest mode
- **Funcionalitat**:
  - Arrossegar el mapa per moure'l
  - Fer zoom amb la roda del ratolí
  - Utilitzar els controls de zoom (+/-)
  - Doble clic per fer zoom
- **Cursor**: Mà (grab)

### 📍 Mode Afegir Waypoint
- **Funcionalitat**:
  - Clicar al mapa per afegir waypoints
  - Desactiva el moviment del mapa per evitar moviments accidentals
  - Cada waypoint apareix com un marcador blau
  - Amb 2+ waypoints es genera automàticament la ruta
- **Cursor**: Creu (crosshair)
- **Indicador**: Banner informatiu blau amb instruccions

## Eines Addicionals

### 🔙 Desfer Últim
- Elimina l'últim waypoint afegit
- Només apareix quan hi ha waypoints
- Color: Taronja

### 🗑️ Esborrar Tot
- Elimina tots els waypoints i la ruta
- Demana confirmació abans d'esborrar
- Només apareix quan hi ha waypoints
- Color: Vermell

## Components Creats

### MapToolbarComponent
**Ubicació**: `src/app/features/stage-editor/components/map-toolbar/`

Toolbar amb botons per:
- Canviar de mode (Pan / Afegir Waypoint)
- Desfer últim waypoint
- Esborrar tot

### MapService - Nous Mètodes

```typescript
// Canviar mode del mapa
setMode(mode: 'pan' | 'addWaypoint'): void

// Eliminar últim waypoint
removeLastWaypoint(): void

// Signal del mode actual
currentMode: Signal<MapMode>
```

## Flux d'Ús

1. **Inicia en Mode Pan** (per defecte)
   - Pots explorar el mapa lliurement

2. **Canvia a Mode Afegir Waypoint**
   - Clica el botó "Afegir Waypoint"
   - El cursor canvia a creu
   - Apareix un banner informatiu

3. **Afegeix Waypoints**
   - Clica als punts on vols que passi la ruta
   - Amb 2+ waypoints es genera la ruta automàticament

4. **Corregeix Errors**
   - "Desfer Últim" per eliminar el darrer punt
   - "Esborrar Tot" per començar de nou

5. **Torna a Mode Pan**
   - Clica "Moure Mapa" per explorar el resultat

## Indicadors Visuals

### Botons Actius
- **Fons blau** + **Text blanc** = Mode actiu
- **Fons gris** + **Text gris** = Mode inactiu

### Banner Informatiu
Quan estàs en mode "Afegir Waypoint":
```
ℹ️ Mode Afegir Waypoints
Clica al mapa per afegir waypoints. 
Necessites mínim 2 punts per crear una ruta.
```

## Exemple de Layout

```
┌─────────────────────────────────────────────┐
│ Toolbar d'Eines                              │
│ [🗺️ Moure Mapa] [📍 Afegir Waypoint]        │
│ [🔙 Desfer Últim] [🗑️ Esborrar Tot]          │
├─────────────────────────────────────────────┤
│                                              │
│              MAPA LEAFLET                    │
│         (cursor canvia segons mode)          │
│                                              │
└─────────────────────────────────────────────┘
```

## Icones Utilitzades

- 🗺️ **Moure Mapa**: Capes (layers icon)
- 📍 **Afegir Waypoint**: Pin de localització
- 🔙 **Desfer Últim**: Paperera amb una fletxa
- 🗑️ **Esborrar Tot**: Paperera

## Avantatges

✅ **Intuïtiu** - Modes clarament diferenciats
✅ **Visual** - Cursor i colors indiquen el mode actiu
✅ **Informatiu** - Banner explica què fer en cada mode
✅ **Segur** - Confirmació abans d'esborrar tot
✅ **Reversible** - Pots desfer el darrer waypoint
✅ **Responsive** - Botons amb hover i transicions

## Fitxers Modificats/Creats

- ✅ `map-toolbar.component.ts` (nou)
- ✅ `map.service.ts` (afegit modes i control de cursor)
- ✅ `map.component.ts` (mode pan per defecte)
- ✅ `stage-editor.component.ts` (integració del toolbar)

## Proves

1. Obre **http://localhost:4201/**
2. Ves a **"Editor de Tram"**
3. Hauries de veure el toolbar sobre el mapa
4. Prova els diferents modes:
   - Mode Pan: arrossega el mapa
   - Mode Afegir: clica per afegir waypoints
   - Desfer: elimina l'últim
   - Esborrar: elimina tot

Ara tens control total sobre la interacció amb el mapa! 🎉
