# 📥 Instrucciones para Descargar la Fuente Pokemon Solid

## 🔗 Enlace de Descarga
https://www.fontspace.com/pokemon-solid-font-f13844

## 📋 Pasos para Instalar:

1. **Descargar la fuente:**
   - Ve al enlace: https://www.fontspace.com/pokemon-solid-font-f13844
   - Haz clic en el botón "Download" (azul)
   - Se descargará un archivo ZIP

2. **Extraer los archivos:**
   - Descomprime el archivo ZIP descargado
   - Busca el archivo de fuente (normalmente `PokemonSolid.ttf`)

3. **Copiar a este directorio:**
   - Copia el archivo `.ttf` a esta carpeta (`public/fonts/`)
   - Renómbralo como: `PokemonSolid.ttf`

4. **Conversión a formatos web (Opcional):**
   Para mejor compatibilidad con navegadores, puedes convertir la fuente a formatos `.woff` y `.woff2`:
   
   - Usa: https://cloudconvert.com/ttf-to-woff2
   - Convierte `PokemonSolid.ttf` a `PokemonSolid.woff2`
   - Convierte `PokemonSolid.ttf` a `PokemonSolid.woff`
   - Coloca ambos archivos en esta carpeta

## 📄 Archivos Necesarios:

```
public/fonts/
├── PokemonSolid.ttf      ← Requerido
├── PokemonSolid.woff2    ← Recomendado (mejor rendimiento)
└── PokemonSolid.woff     ← Recomendado (compatibilidad)
```

## ⚖️ Licencia

**Fuente:** Pokemon Solid  
**Autor:** Fonts & Things  
**Licencia:** Creative Commons Attribution (CC BY)  
**Requisito:** Debes dar crédito al autor  

La atribución ya está incluida en el archivo `src/styles.scss` del proyecto.

## 📝 Nota Importante

Una vez descargues y copies los archivos de la fuente a esta carpeta, la aplicación automáticamente los cargará y aplicará en los títulos principales.

Si no descargas la fuente, la aplicación funcionará normalmente pero usará las fuentes predeterminadas del sistema.

