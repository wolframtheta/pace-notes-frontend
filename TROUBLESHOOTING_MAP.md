# Troubleshooting - Mapa no Apareix

## Canvis Fets per Solucionar el Problema

### 1. Alçada Mínima al Contenidor del Mapa
- Afegit `style="min-height: 500px;"` al div del mapa
- Afegit `min-h-0` al contenidor flex per forçar l'alçada

### 2. Timeout a la Inicialització
- Afegit timeout de 100ms per assegurar que el DOM està completament renderitzat abans d'inicialitzar Leaflet

### 3. Estils al Component
- Afegit `:host { display: block; height: 100%; }` al stage-editor
- Afegit alçada mínima al main-layout

## Debugging al Navegador

### 1. Obre la Consola del Navegador
Prem `F12` o `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)

### 2. Comprova Errors de JavaScript
A la pestanya "Console", busca:
- Errors de Leaflet
- Errors de "Container is not defined"
- Errors de CSS

### 3. Comprova que el Div del Mapa Existeix
A la pestanya "Elements" (o "Inspeccionar"), busca:
```html
<div id="map" class="w-full h-full rounded-lg shadow-lg" style="min-height: 500px;"></div>
```

### 4. Comprova l'Alçada del Contenidor
Amb el div #map seleccionat, comprova a "Computed" que tingui alçada > 0

### 5. Verifica que Leaflet CSS es Carrega
A la pestanya "Network":
- Filtra per "CSS"
- Busca "leaflet.css"
- Hauria d'estar amb status 200

## Solucions Comunes

### El div té alçada 0
```typescript
// Si el contenidor pare no té alçada, el mapa tampoc en tindrà
// Solució: Afegir min-height o height explícit
```

### Leaflet s'inicialitza abans que el DOM estigui llest
```typescript
// Solució: Usar setTimeout o AfterViewInit correctament
setTimeout(() => this.mapService.initMap('map'), 100);
```

### CSS de Leaflet no es carrega
```css
/* Verifica que styles.css tingui: */
@import "leaflet/dist/leaflet.css";
```

### El contenidor #map no existeix
```typescript
// Error: "Map container not found"
// Solució: Assegurar que el selector és correcte i que el DOM està renderitzat
```

## Test Manual

1. Ves a **http://localhost:4201/**
2. Clica **"Editor de Tram"** al sidebar
3. Hauries de veure:
   - Un mapa amb tiles d'OpenStreetMap
   - Zoom controls (+/-)
   - Pots fer zoom i pan
   - Pots clicar per afegir waypoints (marcadors blaus)

## Si Encara No Funciona

### Opció 1: Force Reload
1. Prem `Cmd+Shift+R` (Mac) o `Ctrl+F5` (Windows)
2. Això força un reload complet amb clear de cache

### Opció 2: Verifica l'Ordre d'Imports
```typescript
// A stage-editor.component.ts, comprova que MapComponent està importat
imports: [MapComponent, RouteToolbarComponent, RouteSummaryComponent, FormsModule]
```

### Opció 3: Console Log al MapService
Afegeix logs per debug:
```typescript
ngAfterViewInit(): void {
  setTimeout(() => {
    console.log('Inicialitzant mapa...');
    const mapElement = document.getElementById('map');
    console.log('Map element:', mapElement);
    console.log('Map element height:', mapElement?.offsetHeight);
    
    this.mapService.initMap('map');
  }, 100);
}
```

## Estructura Esperada

```
<app-stage-editor>
  <div class="h-full flex gap-4">
    <div class="flex-1 flex flex-col gap-4">
      <div class="flex-1 min-h-0">
        <div class="relative h-full">
          <app-map>
            <div id="map" style="min-height: 500px;">
              <!-- Aquí Leaflet renderitza el mapa -->
            </div>
          </app-map>
        </div>
      </div>
    </div>
  </div>
</app-stage-editor>
```

## Checklist Final

- [ ] El servidor de dev està executant-se (port 4201)
- [ ] No hi ha errors a la consola del navegador
- [ ] El fitxer leaflet.css es carrega (Network tab)
- [ ] El div #map existeix al DOM (Elements tab)
- [ ] El div #map té alçada > 0px (Computed styles)
- [ ] AfterViewInit s'executa (afegir console.log)
- [ ] MapService.initMap() s'executa sense errors

Si tot això és correcte i encara no es veu el mapa, pot ser un problema amb la versió de Leaflet o conflictes de CSS.
