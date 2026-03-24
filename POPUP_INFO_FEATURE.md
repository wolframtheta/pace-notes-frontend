# Popups Informatius dels Pins

## Nova Funcionalitat: Popups Millorats ✅

Els pins al mapa ara tenen popups detallats i visualment atractius amb tota la informació de cada nota.

## Com Veure la Informació

### 📍 Clic als Pins
Simplement **clica qualsevol pin** (vermell, taronja o verd) al mapa i s'obrirà un popup amb tota la informació.

## Informació Mostrada

### Per a Corbes 🔄

#### Capçalera
- **Etiqueta de la nota** (ex: "3E", "5D") - Gran i destacada
- **Número de posició** (ex: "Nota #2")
- **Color gradient** segons tipus:
  - Vermell: Corba Esquerra
  - Taronja: Corba Dreta

#### Detalls
1. **Tipus**: Corba Esquerra ⬅️ / Corba Dreta ➡️
2. **Angle**: X.X° (amb un decimal de precisió)
3. **Categoria de Corba**:
   - Molt oberta (< 30°)
   - Oberta (30-60°)
   - Normal (60-90°)
   - Tancada (90-120°)
   - Molt tancada (120-150°)
   - Hairpin (> 150°)
4. **Direcció**: Esquerra / Dreta
5. **Coordenades**: Lat, Lng (5 decimals)

### Per a Rectes ➡️

#### Capçalera
- **Etiqueta de la nota** (ex: "120m") - Gran i destacada
- **Número de posició** (ex: "Nota #1")
- **Color gradient verd**

#### Detalls
1. **Tipus**: Recta ➡️
2. **Distància**: X m
3. **Longitud de la Recta**:
   - Molt curta (< 50m)
   - Curta (50-100m)
   - Mitjana (100-200m)
   - Llarga (200-500m)
   - Molt llarga (> 500m)
4. **Coordenades**: Lat, Lng (5 decimals)

### Notes Personalitzades 📝

Si has afegit text personalitzat a una nota, apareixerà en una secció especial amb:
- Fons gris clar
- Barra lateral blava
- Text en cursiva
- Etiqueta "Nota personalitzada"

## Disseny Visual

### Colors i Estil
```
┌─────────────────────────────┐
│ ■■■■■■■■■■■■■■■■■■■■■■■■■■  │ ← Capçalera gradient
│   3E                        │   (vermell/taronja/verd)
│   Nota #2                   │
├─────────────────────────────┤
│ [Tipus]                     │
│                             │
│ Angle:        45.2°         │ ← Taula de dades
│ Categoria:    Oberta        │
│ Direcció:     Esquerra      │
│ Coordenades:  41.38, 2.17   │
│                             │
│ ┃ Nota personalitzada       │ ← Secció optional
│ ┃ "Vigilar el públic..."    │
└─────────────────────────────┘
```

### Estils Aplicats
- ✅ **Border radius**: 12px per cantonades arrodonides
- ✅ **Shadow**: Ombra suau per destacar
- ✅ **Gradient**: Capçalera amb gradient de color
- ✅ **Typography**: Font system-ui per consistència
- ✅ **Tables**: Dades organitzades en taula
- ✅ **Badges**: Fons de color per tipus de nota

## Interacció

### Obrir Popup
- **Clic al pin**: Obre el popup
- **Esc**: Tanca el popup
- **Clic fora**: Tanca el popup
- **X a dalt**: Botó per tancar (blanc sobre la capçalera)

### Navegació
- Pots tenir **múltiples popups oberts** simultàniament
- Cada popup és **independent**
- El mapa es pot **moure amb el popup obert**

## Casos d'Ús

### 1. Revisar Angles
Clica cada corba per veure l'angle exacte i la categoria.

### 2. Verificar Distàncies
Clica cada recta per veure la distància precisa.

### 3. Veure Notes Personalitzades
Les notes que has editat manualment apareixen destacades.

### 4. Obtenir Coordenades
Per debugging o exportació, les coordenades exactes estan disponibles.

## Exemple de Popup de Corba

```
┌───────────────────────────────┐
│ ████████████████████████████  │ (gradient vermell)
│   3E                          │
│   Nota #2                     │
├───────────────────────────────┤
│                               │
│ 🔄 Corba Esquerra ⬅️           │
│                               │
│ Angle:        45.2°           │
│ Categoria:    Oberta          │
│ Direcció:     Esquerra        │
│ Coordenades:  41.38517, 2.17  │
│                               │
│ ┃ Nota personalitzada         │
│ ┃ "Atenció grava a la sortida"│
└───────────────────────────────┘
```

## Exemple de Popup de Recta

```
┌───────────────────────────────┐
│ ████████████████████████████  │ (gradient verd)
│   120m                        │
│   Nota #1                     │
├───────────────────────────────┤
│                               │
│ ➡️ Recta                       │
│                               │
│ Distància:    120m            │
│ Longitud:     Mitjana         │
│ Coordenades:  41.38517, 2.17  │
└───────────────────────────────┘
```

## CSS Personalitzat

S'han afegit estils globals per millorar els popups:
- Border radius arrodonit
- Shadow més pronunciada
- Botó de tancar blanc sobre la capçalera
- Transicions suaus

## Avantatges

✅ **Visual**: Colors i categories clares
✅ **Complet**: Tota la informació en un lloc
✅ **Organitzat**: Taules i seccions ben estructurades
✅ **Professional**: Disseny modern i net
✅ **Útil**: Categories que ajuden a entendre la nota
✅ **Precís**: Angles i distàncies amb decimals

## Fitxers Modificats

- ✅ `map.service.ts` - HTML i lògica dels popups
- ✅ `styles.css` - Estils CSS globals per popups

Ara pots veure tota la informació detallada de cada nota amb un simple clic! 🎯📊
