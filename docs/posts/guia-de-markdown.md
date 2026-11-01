> Este es un artículo de prueba para el blog. Reemplázalo o bórralo cuando publiques el tuyo.

Cada artículo es un archivo `.md` dentro de la carpeta `posts`. Para publicarlo solo hay que agregarlo a `data/blog.json` con un `id`, la ruta del archivo y un título.

## Texto

Un párrafo puede ocupar varias líneas seguidas
y se une en uno solo. Se puede usar **negritas**, *itálicas* y `código en línea`.

Los enlaces a otros sitios, como [MDN](https://developer.mozilla.org/es/), se abren en una pestaña nueva. Los que empiezan con `#` abren otro artículo del blog, por ejemplo el del [escenario de experiencias](#escenario-de-experiencias).

## Listas

- Elementos sin orden
- Con guion, asterisco o signo de más
  y con líneas que continúan el elemento anterior

1. Elementos en orden
2. Numerados automáticamente

## Citas

> El mejor código es el que no tienes que escribir.
>
> Las citas pueden tener **formato** y varios párrafos.

## Código

```js
const saludo = nombre => `Hola, ${nombre}`
console.log(saludo('mundo'))
```

### Subtítulos

Los títulos con `#` bajan un nivel dentro del artículo, así nunca compiten con el título principal.

## Imágenes

Las rutas son relativas al archivo `.md`, igual que en GitHub:

![Línea del Palacio de Bellas Artes](../sprites/bellas_artes.svg)

---

El HTML escrito dentro de un artículo se muestra como texto, por ejemplo <b>esto no sale en negritas</b>.
