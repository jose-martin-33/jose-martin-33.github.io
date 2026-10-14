# Portfolio de José Martín

**Español** · [English](README.en.md)

Sitio estático, sin build, para GitHub Pages: `jose-martin-33.github.io`.

```
index.html     estructura, SEO (meta, Open Graph, Twitter Card, JSON-LD)
styles.css     paleta, modo claro/oscuro, responsive
script.js      idioma, filtros, modales, mapa, contadores, formulario
locales.js     TODOS los textos en español e inglés
assets/        favicon.svg, og-image.png, foto.webp
.nojekyll      evita que GitHub procese el sitio con Jekyll
```

## Antes de publicar

- **Foto**: ya está en `assets/foto.webp`. Si la cambias, usa formato vertical 4:5.
- **Marcadores**: si en el futuro añades algo como `[AÑADIR: ...]` en `locales.js`, se
  verá resaltado en naranja en la web hasta que lo sustituyas.

## 1. Crear el repositorio

1. Entra en <https://github.com> con la cuenta **jose-martin-33**.
2. Pulsa **+ → New repository**.
3. En *Repository name* escribe exactamente `jose-martin-33.github.io`.
4. Márcalo como **Public** y pulsa **Create repository**.

## 2. Subir los archivos

**Opción sencilla (navegador):**

1. En el repo recién creado, pulsa **uploading an existing file**.
2. Arrastra el *contenido* de la carpeta (no la carpeta en sí): `index.html`, `styles.css`,
   `script.js`, `locales.js`, `README.md`, `.nojekyll` y la carpeta `assets`.
   Si tu sistema oculta `.nojekyll`, no pasa nada: es opcional.
3. Escribe un mensaje (por ejemplo "Primera versión") y pulsa **Commit changes**.

**Opción con Git:**

```bash
cd ruta/a/la/carpeta/portfolio
git init
git add .
git commit -m "Primera versión del portfolio"
git branch -M main
git remote add origin https://github.com/jose-martin-33/jose-martin-33.github.io.git
git push -u origin main
```

## 3. Activar GitHub Pages

1. En el repo, ve a **Settings → Pages**.
2. En *Source* elige **Deploy from a branch**.
3. En *Branch* elige **main** y la carpeta **/ (root)**. Pulsa **Save**.
4. Espera uno o dos minutos y abre <https://jose-martin-33.github.io>.

Cada vez que subas cambios, la web se actualiza sola en uno o dos minutos.

## 4. Configurar Formspree (formulario de contacto)

1. Crea una cuenta gratuita en <https://formspree.io> con tu email.
2. Pulsa **+ New Form**, ponle un nombre (por ejemplo "Portfolio") y elige el email
   donde quieres recibir los mensajes.
3. Formspree te da un endpoint del tipo `https://formspree.io/f/abcdwxyz`.
4. Abre `script.js` y cambia esta línea del principio:

   ```js
   var FORMSPREE_ENDPOINT = "https://formspree.io/f/TU_ID";
   ```

   por tu endpoint, por ejemplo:

   ```js
   var FORMSPREE_ENDPOINT = "https://formspree.io/f/abcdwxyz";
   ```

5. Sube el `script.js` modificado al repo.
6. En Formspree, en **Settings → Restrict to domain**, añade `jose-martin-33.github.io`
   para que nadie más pueda usar tu formulario.
7. Envía un mensaje de prueba desde la web. La primera vez Formspree te pedirá
   confirmar el email.

## Editar textos

Todo el texto está en `locales.js`, en dos bloques: `es` y `en`. Cambia el texto entre
comillas y guarda; no hace falta tocar el HTML. Los proyectos, la trayectoria, las
habilidades y los nodos del mapa también se editan ahí.

## Comprobar el SEO al compartir

Después de publicar, pega la URL en <https://www.opengraph.xyz> o en el
[Post Inspector de LinkedIn](https://www.linkedin.com/post-inspector/) para ver cómo
queda la vista previa con `assets/og-image.png`.
