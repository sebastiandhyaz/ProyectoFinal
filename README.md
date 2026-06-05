# Simulación Numérica - Métodos Numéricos

## Enlace página web
[URL de GitHub Pages aquí]

## Repositorio Git
[URL del repo aquí]

## Integrantes
- [Nombre completo]: Todos los módulos (A-G)

## Escenarios implementados
- [x] A: Optimización abastecimiento y red de transporte
- [x] B: Vaciado crítico de reservas
- [x] C: Desabastecimiento y curva de precios
- [x] D: Costo acumulado y poder adquisitivo
- [x] E: Umbrales críticos de abastecimiento
- [x] F: Rumores y pánico (sistemas mal condicionados)
- [x] G: Difusión de opinión/descontento social

## Métodos numéricos implementados
| Área | Métodos | Archivo |
|------|---------|---------|
| Sistemas lineales | LU, Jacobi, Gauss-Seidel, SOR, Gradiente Conjugado | js/metodos/sistemas_lineales.js |
| Raíces | Bisección, Newton-Raphson, Secante | js/metodos/raices.js |
| Interpolación | Lagrange, Newton, Splines | js/metodos/interpolacion.js |
| Integración | Trapecio, Simpson 1/3, Simpson 3/8 | js/metodos/integracion.js |
| EDOs | Euler, Heun, RK4 | js/metodos/edo.js |

## Datos de ejemplo utilizados

### Módulo 1: Sistemas Lineales — Distribución de Combustible
Matriz A (3×3):
```
 4  -1   0     | 15
-1   4  -1     | 10
 0  -1   3     | 10
```

### Módulo 2: Raíces — Funciones de Crisis
| Función | Expresión | Intervalo |
|---------|-----------|-----------|
| Reservas Críticas | f(x) = 1000·e^(-0.1x) + 50x - 500 | [0, 20] |
| Equilibrio Precio | f(x) = x³ - 20x² + 100x - 100 | [0, 5] |
| Umbral Demanda | f(x) = 200/(1+e^(-0.5(x-10))) - 150 | [0, 25] |

### Módulo 3: Interpolación — Precios de Alimentos
| Producto | Datos (día, precio Bs/kg) |
|----------|---------------------------|
| Papa | (1,8), (5,10), (10,13), (15,16), (20,19), (30,22) |
| Arroz | (1,12), (7,15), (14,18), (21,22), (28,26) |
| Azúcar | (1,6), (10,9), (20,14), (30,20) |

### Módulo 4: Integración — Funciones de Precio
| Función | Expresión |
|---------|-----------|
| Precio Papa | p(t) = 8 + 0.5t + 0.01t² |
| Canasta Básica | c(t) = 150 + 5t + 0.1t² |

### Módulo 5: EDOs — Modelos Dinámicos
**Modelo A - Reservas:** R'(t) = 100 - (50 + 5t), R(0) = 1000, t ∈ [0, 30]

**Modelo B - Difusión Social (NMD):**
- N'(t) = -0.001·N·M + 0.01·D
- M'(t) = 0.001·N·M - 0.005·M·D
- D'(t) = 0.02·M - 0.01·D
- N(0)=10000, M(0)=100, D(0)=50, t ∈ [0, 60]

## Decisiones de diseño
- **Arquitectura vanilla (HTML/CSS/JS):** Se eligió para garantizar compatibilidad total con GitHub Pages sin necesidad de build step, servidores o dependencias de Node.js. Cualquier usuario puede clonar el repo y abrir index.html directamente.
- **Chart.js vía CDN:** Proporciona gráficos interactivos de alta calidad sin aumentar el peso del repositorio. La versión 4.4.0 ofrece soporte nativo para gráficos responsive y múltiples tipos de visualización.
- **Single Page Application con scroll:** En lugar de múltiples páginas, se optó por secciones en una sola página con navegación por scroll, lo que facilita la comparación entre módulos y la experiencia de lectura continua.
- **CSS sin frameworks:** Diseño completo personalizado para lograr una estética profesional académica sin la rigidez de frameworks como Bootstrap o Tailwind.
- **Módulos independientes:** Cada archivo JS de método numérico es completamente independiente y exporta sus funciones en un namespace global. Esto facilita el mantenimiento y la adición de nuevos métodos.

## Limitaciones conocidas
- **Modelos simplificados:** Los modelos matemáticos son simplificaciones con fines didácticos. No representan la complejidad real de los fenómenos de crisis.
- **Datos hipotéticos:** Los datos de ejemplo no provienen de fuentes reales sino que fueron diseñados para ilustrar el comportamiento de los métodos.
- **Precisión numérica:** JavaScript usa punto flotante de doble precisión (IEEE 754), lo que introduce errores de redondeo en cálculos extensos.
- **Modelo NMD:** El modelo de difusión social no considera factores como medios de comunicación masiva, intervención gubernamental, fatiga social o heterogeneidad poblacional.
- **Extrapolación:** La interpolación solo es confiable dentro del rango de datos; la extrapolación puede dar resultados físicamente irrealistas.
- **Convergencia de métodos iterativos:** Jacobi y Gauss-Seidel requieren dominancia diagonal para garantizar convergencia.
- **Estabilidad numérica de EDOs:** Para el modelo NMD con parámetros extremos, los métodos pueden volverse inestables, especialmente Euler con paso grande.

## Instrucciones para ejecutar localmente
1. Clonar el repositorio:
   ```bash
   git clone [URL_DEL_REPO]
   cd ProyectoFinal
   ```
2. Abrir `index.html` directamente en el navegador
3. O usar un servidor local:
   ```bash
   python -m http.server 8000
   ```
   Luego visitar `http://localhost:8000`

## METADATA PARA GENERACIÓN DE INFORME

### Contexto del problema
En contextos de crisis socioeconómica, los fenómenos de abastecimiento, variación de precios y dinámicas sociales presentan comportamientos que pueden ser modelados y analizados mediante herramientas matemáticas. La escasez de recursos, el aumento sostenido de precios de alimentos básicos y la propagación de información en poblaciones son procesos que, aunque complejos, pueden simplificarse en modelos matemáticos que permiten comprender sus tendencias fundamentales.

La distribución de recursos limitados desde centros de almacenamiento hacia zonas de consumo genera naturalmente sistemas de ecuaciones lineales. Los puntos de quiebre en reservas, precios y demanda se modelan como raíces de ecuaciones no lineales. La evolución de precios con datos dispersos requiere técnicas de interpolación. El costo acumulado durante períodos de inflación se calcula mediante integración numérica. Y la dinámica temporal de reservas y fenómenos sociales se describe mediante ecuaciones diferenciales ordinarias.

Este proyecto implementa una plataforma interactiva que permite al usuario experimentar con estos modelos, modificar parámetros, observar resultados en tiempo real y comparar la eficacia de diferentes métodos numéricos para resolver cada tipo de problema.

La motivación pedagógica es doble: por un lado, los estudiantes aprenden las técnicas numéricas al observar su comportamiento con datos concretos; por otro lado, desarrollan intuición sobre fenómenos de crisis al ver cómo los parámetros del modelo afectan las predicciones.

### Objetivo general
Diseñar e implementar una página web interactiva que aplique métodos numéricos al análisis cuantitativo de escenarios de abastecimiento, precios de alimentos básicos y dinámica social, permitiendo al usuario experimentar con diferentes algoritmos, parámetros y modelos matemáticos.

### Objetivos específicos cumplidos
1. **Resolver sistemas de ecuaciones lineales** para optimizar la distribución de combustible entre plantas y zonas: Implementado mediante 5 métodos (Jacobi, Gauss-Seidel, SOR, LU, Gradiente Conjugado) con matriz editable, simulación de bloqueo de rutas y cálculo de número de condición.

2. **Encontrar raíces de ecuaciones no lineales** para identificar puntos críticos de reservas, precios y demanda: Implementado con 3 métodos (Bisección, Newton-Raphson, Secante), funciones predefinidas y personalizadas, comparación automática y estimación del orden de convergencia.

3. **Interpolar datos dispersos de precios** para estimar valores intermedios: Implementado con Lagrange, Newton (diferencias divididas) y Splines cúbicos naturales. Incluye datos de 3 productos alimenticios y comparación gráfica de métodos.

4. **Calcular integrales numéricas** para cuantificar costos acumulados: Implementado con Trapecio, Simpson 1/3 y Simpson 3/8 compuestos. Incluye análisis de pérdida de poder adquisitivo comparando precios variables vs. constantes.

5. **Resolver ecuaciones diferenciales ordinarias** para simular dinámicas temporales: Implementado con Euler, Heun y RK4 para el modelo de vaciado de reservas (escalar) y difusión social NMD (sistema). Incluye detección de día crítico, diagrama de fases y sliders de parámetros.

6. **Visualizar resultados** mediante gráficos interactivos: Chart.js utilizado para gráficos de convergencia, funciones, interpolación, áreas de integral, evolución temporal y diagramas de fases.

7. **Generar interpretaciones automáticas** de los resultados numéricos en contexto de crisis: Cada módulo genera texto interpretativo basado en los valores calculados, explicando su significado en el contexto del problema.

### Descripción técnica por módulo

#### Módulo 1: Sistemas de Ecuaciones Lineales
**Fundamento:** Ax = b donde A es la matriz de coeficientes de capacidad de rutas, x es el vector de flujos y b el vector de demandas.

**Pseudocódigo Jacobi:**
```
Para k = 1, 2, ..., maxIter:
  Para i = 1, ..., n:
    x_i^(k+1) = (b_i - Σ_{j≠i} a_ij * x_j^(k)) / a_ii
  Si ||x^(k+1) - x^(k)|| < tol: convergió
```

**Entradas:** Matriz A (n×n), vector b (n), tolerancia, máx. iteraciones, x₀ inicial, omega (SOR)
**Salidas:** Vector solución, tabla de iteraciones, gráfico de convergencia, número de condición, interpretación

#### Módulo 2: Raíces de Ecuaciones
**Fundamento:** Encontrar x* tal que f(x*) = 0.

**Pseudocódigo Newton-Raphson:**
```
x_0 dado
Para n = 0, 1, 2, ...:
  x_{n+1} = x_n - f(x_n) / f'(x_n)
  Si |f(x_{n+1})| < tol: convergió
```

**Entradas:** Función f(x), derivada (o numérica), parámetros del método
**Salidas:** Raíz, iteraciones, gráfico de función con raíz, orden de convergencia

#### Módulo 3: Interpolación
**Fundamento:** Dado {(x_i, y_i)}, construir P(x) tal que P(x_i) = y_i.

**Entradas:** Puntos de datos, método, punto a evaluar
**Salidas:** Valor interpolado, polinomio, tabla de diferencias divididas, gráfico

#### Módulo 4: Integración Numérica
**Fundamento:** Aproximar ∫_a^b f(x)dx dividiendo [a,b] en n subintervalos.

**Entradas:** Función, límites, número de subintervalos
**Salidas:** Valor de integral, error estimado, tabla paso a paso, gráfico de área

#### Módulo 5: Ecuaciones Diferenciales
**Fundamento:** Dado dy/dt = f(t,y), y(t₀) = y₀, encontrar y(t).

**Pseudocódigo RK4:**
```
Para n = 0, 1, ..., N-1:
  k1 = f(t_n, y_n)
  k2 = f(t_n + h/2, y_n + h*k1/2)
  k3 = f(t_n + h/2, y_n + h*k2/2)
  k4 = f(t_n + h, y_n + h*k3)
  y_{n+1} = y_n + (h/6)(k1 + 2k2 + 2k3 + k4)
```

**Entradas:** Modelo, parámetros, condiciones iniciales, h, t_final
**Salidas:** Tabla de valores, gráfico temporal, diagrama de fases, día crítico

### Resultados obtenidos
Los resultados se generan interactivamente en la aplicación. A continuación se describen resultados típicos:

- **Sistemas Lineales:** La distribución óptima de combustible con la matriz ejemplo converge en ~15 iteraciones (Gauss-Seidel), ~25 (Jacobi). SOR con ω=1.25 converge en ~10 iteraciones. Número de condición κ(A) ≈ 5.8 (bien condicionada).

- **Raíces:** La función de reservas críticas tiene raíz en x ≈ 3.72. Bisección requiere ~17 iteraciones, Newton ~5, Secante ~6. Esto confirma el orden de convergencia teórico.

- **Interpolación:** Los Splines cúbicos producen curvas más suaves para los precios de alimentos, mientras que Lagrange/Newton generan el mismo polinomio con oscilaciones para datos dispersos.

- **Integración:** El costo acumulado de papa en 30 días es ~550 Bs (Simpson 1/3, n=10), vs. 232 Bs a precio constante. Pérdida de poder adquisitivo: ~137%.

- **EDOs:** Las reservas alcanzan nivel crítico (R < 100) alrededor del día 18 (RK4). Euler predice ~día 17, mostrando el efecto del método en la predicción.

### Análisis comparativo
- **Sistemas Lineales:** Gauss-Seidel converge más rápido que Jacobi (~40% menos iteraciones). SOR con ω óptimo supera a ambos. LU da resultado directo sin iteraciones.
- **Raíces:** Newton tiene convergencia cuadrática pero es sensible al x₀. Bisección es robusto pero lento. Secante es el mejor compromiso.
- **Interpolación:** Lagrange y Newton dan resultados idénticos. Splines son superiores para datos con muchos puntos.
- **Integración:** Simpson 1/3 es 100-1000x más preciso que Trapecio con el mismo n para funciones suaves.
- **EDOs:** RK4 con h=1 es más preciso que Euler con h=0.5, usando similar esfuerzo computacional.

### Conclusiones
1. La elección del método numérico depende fundamentalmente del tipo de problema y los requisitos de precisión.
2. Los métodos de mayor orden (Newton, Simpson, RK4) ofrecen mejor precisión pero pueden requerir más información (derivadas) o ser más sensibles a parámetros iniciales.
3. La visualización interactiva permite comprender intuitivamente conceptos como convergencia, estabilidad y precisión.
4. Los modelos matemáticos, aunque simplificados, capturan tendencias fundamentales de fenómenos de crisis.
5. La implementación en JavaScript vanilla demuestra que herramientas numéricas sofisticadas pueden ejecutarse directamente en el navegador sin infraestructura de servidor.

### Referencias
- Burden, R.L. & Faires, J.D. (2010). *Numerical Analysis*, 9th Edition. Brooks/Cole.
- Chapra, S.C. & Canale, R.P. (2015). *Numerical Methods for Engineers*, 7th Edition. McGraw-Hill.
- Chart.js Documentation: https://www.chartjs.org/docs/
- MDN Web Docs - JavaScript: https://developer.mozilla.org/es/docs/Web/JavaScript
