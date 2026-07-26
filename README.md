# Analizador de Redes Sociales Discretas

Aplicación web interactiva desarrollada como proyecto académico para la asignatura de **Matemáticas Discretas** de la **Universidad Nacional de Colombia**.

El proyecto permite construir y analizar redes sociales mediante grafos no dirigidos, aplicando algoritmos clásicos de teoría de grafos para obtener métricas y visualizar la estructura de la red de manera interactiva.

---
## Integrantes

**Laura Sophia Castro**

Ingeniería de Sistemas y Computación

Universidad Nacional de Colombia

---
## Objetivo

Desarrollar una aplicación web interactiva que permita modelar y analizar redes sociales mediante grafos no dirigidos, aplicando algoritmos fundamentales de la teoría de grafos para calcular métricas estructurales y visualizar las relaciones entre los distintos nodos de la red.

---

## Características

- Gestión de personas (nodos).
- Gestión de relaciones (aristas).
- Visualización interactiva del grafo.
- Escalado automático de nodos según su grado.
- Detección de componentes conexas.
- Identificación de nodos puente (puntos de articulación).
- Cálculo del grado de cada nodo.
- Cálculo de la densidad del grafo.
- Cálculo de distancias mínimas mediante BFS.
- Panel de detalles del nodo seleccionado.
- Exportación de informes en formato Markdown.
- Persistencia automática mediante LocalStorage.

---

## Tecnologías utilizadas

- React
- TypeScript
- Vite
- Tailwind CSS
- SVG
- Lucide React

---
## Requisitos

- Node.js 18 o superior.
- npm 9 o superior.
- Navegador web moderno compatible con JavaScript.

---
## Algoritmos implementados

El proyecto implementa diversos algoritmos de teoría de grafos:

- Lista de adyacencia.
- Breadth First Search (BFS).
- Componentes conexas.
- Detección de puntos de articulación (Nodos puente).
- Cálculo de densidad.
- Cálculo del grado de un vértice.
- Caminos mínimos en grafos no ponderados.

---

## Estructura del proyecto

```text
src/
│
├── components/
│   ├── CommunityView.tsx
│   ├── DetailPanel.tsx
│   ├── GlobalMetrics.tsx
│   ├── NetworkGraph.tsx
│   └── SettingsPanel.tsx
│
├── utils/
│   ├── defaultData.ts
│   └── graphAlgorithms.ts
│
├── App.tsx
├── main.tsx
├── types.ts
└── index.css
```

---

## Instalación

Clonar el repositorio

```bash
git clone https://github.com/LauraS2-0/An-lisis-de-redes-sociales.git
```

Entrar al proyecto

```bash
cd An-lisis-de-redes-sociales
```

Instalar dependencias

```bash
npm install
```

Ejecutar en modo desarrollo

```bash
npm run dev
```

Generar versión de producción

```bash
npm run build
```

---

## Uso

1. Agregar personas a la red.
2. Crear relaciones entre ellas.
3. Visualizar automáticamente el grafo.
4. Seleccionar un nodo para inspeccionar sus propiedades.
5. Consultar las métricas globales.
6. Exportar el informe generado.

---

## Objetivos académicos

Este proyecto busca aplicar conceptos de Matemáticas Discretas como:

- Grafos simples no dirigidos.
- Listas de adyacencia.
- Recorridos BFS.
- Componentes conexas.
- Caminos mínimos.
- Puntos de articulación.
- Densidad de grafos.

---

## Verificación del funcionamiento

Para comprobar el correcto funcionamiento:

1. Ejecutar la aplicación.
2. Agregar una persona.
3. Crear relaciones.
4. Seleccionar un nodo.
5. Verificar las métricas.
6. Exportar el informe.
---

## Estado del proyecto

Proyecto finalizado y funcional.

Actualmente permite construir y analizar redes sociales mediante grafos no dirigidos, incluyendo el cálculo de métricas estructurales, componentes conexas, nodos puente, distancias mínimas y generación automática de informes.

---

## Integrantes

**Laura Sophia Castro**

Ingeniería de Sistemas y Computación

Universidad Nacional de Colombia
