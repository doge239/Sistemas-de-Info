Fotos de referencia para el prototipo académico. Fuente: catálogo de [PC Factory](https://www.pcfactory.cl/).

`products/sources.json` registra la URL de origen y la referencia de cada foto. Algunas fotos corresponden a variantes de la misma familia; son imágenes referenciales y no fichas técnicas del producto ficticio. Las marcas e imágenes pertenecen a sus respectivos titulares.

Cada SKU tiene dos versiones WebP locales, de 320 y 640 px, comprimidas con calidad 78 y sin metadatos. El navegador selecciona la resolución con `srcset` y `sizes`. Se reservan las dimensiones, se cargan las primeras fotos con prioridad y las restantes bajo demanda. Los placeholders no solicitan imágenes externas.

Para volver a preparar las imágenes desde la raíz del repositorio, con Pillow instalado en el entorno Python:

```powershell
./frontend/scripts/download-product-images.ps1
python frontend/scripts/optimize-images.py
```

La descarga consulta el catálogo para las referencias sin ID fijo. Revisar `sources.json` si el proveedor cambia sus resultados. El optimizador elimina únicamente cada JPG de origen después de convertirlo a sus dos versiones WebP.
