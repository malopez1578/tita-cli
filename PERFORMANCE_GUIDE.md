# 🚀 TITA CLI - Guía de Rendimiento

## ⚡ Optimizaciones Implementadas

### 🧠 SmartCache - Caché Inteligente
- **TTL Automático**: 24 horas por defecto
- **Gestión de Tamaño**: Límite de 500MB con limpieza automática
- **Hit Tracking**: Seguimiento de uso para optimización LRU
- **Validación**: Verificación de integridad y URL matching

### 🔄 OptimizedCloner - Clonación Optimizada
- **Shallow Cloning**: `--depth=1` por defecto (3-10x menos datos)
- **Fallback Inteligente**: Automático a full clone si shallow falla
- **Limpieza Automática**: Remoción de directorio .git para ahorrar espacio

### ⚙️ ParallelInstaller - Instalación Paralela
- **Concurrencia Controlada**: Máximo 3 procesos yarn simultáneos
- **Gestión de Errores**: Manejo robusto de fallos individuales
- **Optimización de Recursos**: Evita sobrecarga del sistema

### 🔍 FastFileFinder - Búsqueda Optimizada
- **Límites de Profundidad**: Evita búsquedas infinitas
- **Patrones de Ignore**: Excluye node_modules, .git automáticamente
- **Búsqueda Específica**: package.json y manifest.json optimizados

## 📊 Comandos de Rendimiento

### Ver Estadísticas
```bash
tita perf --stats
```
Muestra:
- Templates en caché
- Tamaño total del caché
- Template más usado
- Tasa de aciertos promedio
- Tips de rendimiento

### Optimización de Caché
```bash
# Limpiar caché antiguo (>7 días)
tita perf --clean

# Optimización completa
tita perf --optimize

# Limpiar todo el caché
tita perf --clear-all
```

### Gestión de Caché
```bash
# Ver estadísticas de caché
tita cache --stats

# Listar templates en caché
tita cache --list

# Limpiar caché completamente
tita cache --clear
```

## 🎯 Mejoras de Rendimiento

### Antes vs Después

| Operación | Antes | Después | Mejora |
|-----------|-------|---------|--------|
| **Clonación de Template** | Full clone (100MB) | Shallow clone (10-30MB) | 3-10x |
| **Instalación de Deps** | Secuencial | Paralela (lotes de 3) | 3x |
| **Cache Hit** | No caché | Instantáneo | ∞x |
| **Búsqueda de Archivos** | Sin límites | Optimizada | 2-5x |

### Casos de Uso Optimizados

1. **Primer Uso**: Clonación shallow + caché
2. **Uso Posterior**: Caché hit instantáneo
3. **Proyectos Complejos**: Instalación paralela
4. **Gestión de Espacio**: Limpieza automática

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
# TTL personalizado (horas)
TITA_CACHE_TTL=48

# Tamaño máximo de caché (MB)
TITA_CACHE_SIZE=1000

# Concurrencia de instalación
TITA_INSTALL_CONCURRENCY=5
```

### Configuración en Código
```typescript
// SmartCache personalizado
const smartCache = new SmartCache(
  logger, 
  cloner, 
  48, // TTL en horas
  1000 // Tamaño máximo en MB
);

// ParallelInstaller personalizado
const installer = new ParallelInstaller(
  executor, 
  logger, 
  5 // Máxima concurrencia
);
```

## 📈 Monitoreo de Rendimiento

### Métricas Clave
- **Hit Rate**: % de templates servidos desde caché
- **Cache Size**: Uso actual del espacio en disco
- **Average Clone Time**: Tiempo promedio de clonación
- **Parallel Jobs**: Eficiencia de instalación paralela

### Logs de Rendimiento
```bash
# Habilitar logging detallado
tita config --set-log-level DEBUG

# Ver logs en tiempo real
tail -f ~/.tita-cli/tita.log
```

## 🚀 Tips de Optimización

### Para Desarrolladores
1. **Usa templates frecuentemente** para maximizar cache hits
2. **Limpia caché regularmente** con `tita perf --clean`
3. **Monitorea uso de espacio** con `tita perf --stats`
4. **Configura TTL según tus necesidades**

### Para Equipos
1. **Comparte configuración** de templates preferidos
2. **Usa mismo directorio de caché** en red local
3. **Establece políticas de limpieza** automática
4. **Documenta templates personalizados**

## 🐛 Troubleshooting

### Caché Corrupto
```bash
# Limpiar caché completamente
tita perf --clear-all

# Verificar integridad
tita perf --stats
```

### Instalación Lenta
```bash
# Verificar configuración de concurrencia
tita config --show

# Optimizar caché
tita perf --optimize
```

### Espacio en Disco
```bash
# Ver uso actual
tita cache --stats

# Limpiar archivos antiguos
tita perf --clean
```

## 📚 Referencias

- [SmartCache API](./src/utils/smart-cache.ts)
- [ParallelInstaller API](./src/utils/parallel-installer.ts)
- [OptimizedCloner API](./src/utils/optimized-cloner.ts)
- [FastFileFinder API](./src/utils/fast-file-finder.ts)
