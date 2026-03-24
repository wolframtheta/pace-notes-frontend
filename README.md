# Rally Pace Notes Generator

Aplicació Angular 21 frontend-only per generar notes de rally (pace notes) a partir de traçats sobre OpenStreetMap.

## Característiques

- 🗺️ **Mapa Interactiu**: Utilitza Leaflet + OpenStreetMap per crear traçats
- 🛣️ **Routing Intel·ligent**: OSRM API per seguir carreteres automàticament
- 📐 **Anàlisi Geomètric**: Turf.js per detectar corbes, rectes, angles i distàncies
- 🗄️ **Persistència**: Neon PostgreSQL serverless per guardar dades
- ⚙️ **Configuració Personalitzable**: Crea els teus propis sistemes de notes (1-6, descriptiu, etc.)
- 🖨️ **Vista d'Impressió**: Exporta i imprimeix les notes generades

## Arquitectura

```
Frontend (Angular 21 + TailwindCSS)
  ├─ Leaflet (mapes OSM)
  ├─ OSRM API (routing)
  ├─ Turf.js (càlculs geomètrics)
  └─ Neon PostgreSQL (BD serverless)
```

## Tecnologies

- **Angular 21** (Standalone Components + Signals)
- **TailwindCSS 4** per estils
- **Leaflet** per renderitzat de mapes
- **Turf.js** per càlculs geomètrics
- **Neon PostgreSQL** (serverless driver) per persistència
- **OSRM Demo API** per routing

## Instal·lació

```bash
# Instal·lar dependències
npm install

# Configurar la connexió a Neon PostgreSQL
# Edita src/environments/environment.ts amb el teu connection string

# Iniciar servidor de desenvolupament
ng serve

# Construir per producció
npm run build
```

## Configuració

### Neon PostgreSQL

El projecte utilitza Neon PostgreSQL serverless. El connection string està a:
- `src/environments/environment.ts`

Les taules es creen automàticament al iniciar l'aplicació.

**⚠️ Seguretat**: El connection string és visible al frontend. Això és acceptable per eines personals/internes, però **NO** per aplicacions públiques. Per produccions públiques, afegeix una capa d'API (Cloudflare Worker, Vercel Edge Function, etc.).

## Ús

### 1. Configurar Sistema de Notes

Ves a **Configuració** i crea o personalitza el teu sistema de notes:
- Sistema clàssic 1-6 (1=hairpin, 6=flat out)
- Sistema personalitzat amb els teus propis rangs d'angles

### 2. Crear un Tram

1. Ves a **Editor de Tram**
2. Introdueix el nom del tram
3. Clica waypoints al mapa per definir el recorregut
4. L'aplicació traça automàticament la ruta seguint carreteres (OSRM)
5. Prem **Analitzar** per generar les notes automàticament
6. Revisa i edita les notes si cal
7. Prem **Guardar** per desar el tram

### 3. Veure Notes

- Llista de **Trams**: Veure tots els trams creats
- Detalls del tram: Notes generades amb angles, distàncies i etiquetes
- **Notes de Pilot**: Vista completa amb opcions d'edició
- **Vista d'Impressió**: Format optimitzat per imprimir

## Algorisme de Detecció

L'aplicació analitza la geometria de la ruta per detectar:

1. **Corbes**: Detecta canvis d'angle significatius (>5°)
   - Calcula l'angle total de la corba
   - Determina direcció (esquerra/dreta)
   - Classifica segons configuració activa

2. **Rectes**: Segments amb canvi d'angle mínim
   - Calcula distància en metres
   - Genera etiqueta amb la distància

## Estructura del Projecte

```
src/app/
├── core/
│   ├── models/          # Interfaces TypeScript
│   └── services/        # DatabaseService
├── features/
│   ├── stage-editor/    # Mapa + creació de rutes
│   ├── stages/          # CRUD de trams
│   ├── pace-notes/      # Visualització i edició de notes
│   └── settings/        # Configuració de sistemes de notes
├── shared/
│   └── components/      # Header, Sidebar
└── layout/              # MainLayoutComponent
```

## Scripts

```bash
# Desenvolupament
npm start              # Inicia servidor dev (port 4200)
ng serve --open        # Inicia i obre navegador

# Build
npm run build          # Build de producció

# Tests
npm test               # Executa tests amb Vitest
```

## Limitacions Conegudes

- **Connection String Visible**: Les credencials de BD són visibles al frontend
- **OSRM Demo API**: Limits de rate i disponibilitat no garantida
- **Només Navegador Modern**: Requereix suport ES2022+

## Millores Futures

- [ ] Backend API per protegir credencials de BD
- [ ] Importar/Exportar GPX/KML
- [ ] Múltiples configuracions actives simultànies
- [ ] Visualització 3D d'elevació
- [ ] Export a formats estàndard de rally (PDF, Excel)
- [ ] Compartir trams amb altres usuaris

## Llicència

MIT

## Autor

Desenvolupat amb Angular 21 + TailwindCSS
