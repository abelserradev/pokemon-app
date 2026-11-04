# 🎨 Guía de Uso de la Fuente Pokemon Solid

## 📖 Introducción

Esta guía explica cómo se utiliza la fuente **Pokemon Solid** en el proyecto y cómo aplicarla correctamente en nuevos componentes.

## 📥 Instalación

Para instalar la fuente, sigue las instrucciones en `public/fonts/README.md`

## 🎯 Aplicación Automática

La fuente Pokemon Solid se aplica **automáticamente** a:

- Todos los elementos `<h1>` (títulos principales)
- Todos los elementos `<h2>` (subtítulos)

### Ejemplo:

```html
<h1>Battle Pokemon</h1>
<!-- Se renderizará con la fuente Pokemon Solid -->

<h2>Conoce el mundo del competitivo Pokemon</h2>
<!-- También usará la fuente Pokemon Solid -->
```

## 🛠️ Aplicación Manual

Si necesitas aplicar la fuente Pokemon a otros elementos, usa la clase `.pokemon-font`:

### HTML:

```html
<div class="pokemon-font">¡Atrápalos a todos!</div>

<button class="pokemon-font">Combatir</button>

<span class="pokemon-font">Nivel 100</span>
```

### O directamente en CSS/SCSS:

```scss
.my-custom-title {
  font-family: var(--font-pokemon);
  text-transform: uppercase;
  letter-spacing: 2px;
}
```

## 🎨 Variables CSS Disponibles

El proyecto define estas variables CSS para las fuentes:

```css
:root {
  --font-pokemon: 'Pokemon Solid', 'Arial Black', sans-serif;
  --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...;
}
```

## 📋 Ejemplos de Uso en Componentes

### 1. Título de Hero Section (Home)

```html
<h1 class="hero-title">Battle Pokemon</h1>
```

Ya tiene la fuente Pokemon automáticamente por ser `<h1>`.

### 2. Título del Header

```html
<h1>Battle Pokemon</h1>
```

Automáticamente usa la fuente Pokemon.

### 3. Botón con Estilo Pokemon

```html
<button class="pokemon-font battle-btn">
  ¡Pelear!
</button>
```

```scss
.battle-btn {
  // Ya tiene font-family: var(--font-pokemon) por la clase .pokemon-font
  font-size: 1.5rem;
  color: #EBBA68;
  background: #014471;
  padding: 1rem 2rem;
  border: none;
  cursor: pointer;
  
  &:hover {
    background: #4FB6BE;
  }
}
```

### 4. Badge de Nivel Pokemon

```html
<div class="pokemon-level pokemon-font">
  Nivel 50
</div>
```

```scss
.pokemon-level {
  // Ya tiene la fuente Pokemon por la clase
  font-size: 1rem;
  color: #F5D05F;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}
```

## 🎨 Mejores Prácticas

### ✅ Buenas Prácticas:

1. **Usar para títulos y textos destacados**
   ```html
   <h1>Título Principal</h1>
   <h2>Subtítulo</h2>
   ```

2. **Combinar con text-transform uppercase**
   ```scss
   .pokemon-title {
     font-family: var(--font-pokemon);
     text-transform: uppercase; // La fuente se ve mejor en mayúsculas
   }
   ```

3. **Agregar letter-spacing para mejor legibilidad**
   ```scss
   .pokemon-text {
     font-family: var(--font-pokemon);
     letter-spacing: 2px; // Mejora la legibilidad
   }
   ```

### ❌ Evitar:

1. **No usar en textos largos o párrafos**
   ```html
   <!-- MAL ❌ -->
   <p class="pokemon-font">
     Lorem ipsum dolor sit amet, consectetur adipiscing elit...
   </p>
   
   <!-- BIEN ✅ -->
   <p>
     Lorem ipsum dolor sit amet, consectetur adipiscing elit...
   </p>
   ```

2. **No usar en formularios o inputs**
   ```html
   <!-- MAL ❌ -->
   <input class="pokemon-font" type="text" />
   
   <!-- BIEN ✅ -->
   <input type="text" />
   ```

3. **No abusar de la fuente**
   - Úsala solo para elementos destacados
   - Mantén la jerarquía visual

## 🎯 Elementos del Proyecto que Usan la Fuente

### Automáticamente (h1, h2):
- ✅ Header: "Battle Pokemon"
- ✅ Home Hero: "Battle Pokemon"
- ✅ Home Features: "Conoce el mundo del competitivo Pokemon"
- ✅ Todos los títulos principales de las páginas

### Con clase .pokemon-font (si se agrega):
- Botones especiales
- Badges
- Elementos destacados

## 📱 Compatibilidad

La fuente se carga en múltiples formatos para máxima compatibilidad:

- `.ttf` - TrueType Font (navegadores modernos)
- `.woff2` - Web Open Font Format 2 (mejor compresión)
- `.woff` - Web Open Font Format (compatibilidad antigua)

Si la fuente no se carga, el sistema usará la fuente fallback: `'Arial Black', sans-serif`

## 🔄 Fallback

Si la fuente Pokemon Solid no está disponible:

```css
font-family: 'Pokemon Solid', 'Arial Black', sans-serif;
                            ↑             ↑
                         Primera         Fallback si no está disponible
```

## ⚖️ Licencia y Atribución

**Importante:** Esta fuente está bajo licencia **Creative Commons Attribution (CC BY)**

**Requisitos:**
- ✅ Dar crédito al autor (Fonts & Things)
- ✅ La atribución ya está incluida en `styles.scss`
- ✅ La atribución también está en el `README.md`

**Enlace original:**
https://www.fontspace.com/pokemon-solid-font-f13844

## 🎨 Paleta de Colores Recomendada

Colores que combinan bien con la fuente Pokemon:

```scss
$primary: #4FB6BE;      // Turquesa
$secondary: #EBBA68;    // Dorado
$accent: #F5D05F;       // Amarillo
$textPrimary: #014471;  // Azul oscuro
```

### Ejemplo de uso:

```scss
.pokemon-title {
  font-family: var(--font-pokemon);
  color: #EBBA68; // Dorado
  text-shadow: 2px 2px 4px rgba(1, 68, 113, 0.5); // Azul oscuro
  text-transform: uppercase;
  letter-spacing: 2px;
}
```

## 📞 Soporte

Si tienes problemas con la fuente:

1. Verifica que el archivo esté en `public/fonts/PokemonSolid.ttf`
2. Revisa la consola del navegador para errores de carga
3. Asegúrate de que el build se completó correctamente
4. Verifica que `styles.scss` esté importado en `angular.json`

---

**Hecho con ❤️ para el proyecto Pokemon Battle**

