## Motivo de este portafolio

Me parece que una excelente manera de dar el o los motivos de algo es partir de las necesidades, ya que estas pueden sustentar no solo el "porqué", sino también el "cómo" y el "por qué de esta manera y no de aquella otra", etc.

Mi portafolio nace de **dos necesidades**. La primera es concreta: **hacer un compendio de mi trabajo visible para posibles empresas o proyectos** en los que pueda participar.

La segunda no es tan directa, pero es de vital importancia: no solo mostrar qué lenguajes conozco o en qué empresas he estado, sino **encontrar una forma de que el mismo portafolio sea una expresión de la manera en que resuelvo problemas**, de lo que encuentro más factible e incluso de aquello que elijo y lo que no.

Después de todo, este portafolio podría tener otros colores, tener una animación más interactiva con three.js, estar completamente generado por un agente de IA o incluso ser tan sencillo como una página HTML que muestre un enlace a mi CV.

Pero este portafolio **intenta capturar un poco de ese proceso personal** que no está en el nombre de un lenguaje, un framework o un agente de IA.

Es ese proceso que está en el **cómo** una idea usa esas herramientas para hacerse presente, y **no en las herramientas mismas**.

## El origen del cómo

**Tenía claro que quería usar canvas y HTML5** para algunas secciones, porque creo que esta tecnología es interesante y algo aterradora en estos tiempos.

Principalmente porque es un **lienzo en blanco**.

No hay nada escrito más allá de las funciones base para comenzar a dibujar algunas figuras geométricas, como un círculo o un cuadrado, y algunas funciones que modifican la matriz de transformaciones, o la propia función window.requestAnimationFrame().

Hace algún tiempo había completado el curso que ofrece MDN ([GitHub - viccg93/canvas_site · GitHub](https://github.com/viccg93/canvas_site)) y me parecía de lo más atractivo para **modelar comportamientos y no solo imágenes estáticas**.

**Así nació la idea** de lo primero que se ve al entrar al portafolio: un canvas en el que aparecen tecnologías volando desde todos lados y hacia todos lados.

## Leyes y comportamientos

El siguiente paso era **encontrar y definir el modelo que rigiera ese "caos"**.

Aquí creo que vale la pena regresar un poco a una etapa de mi juventud, cuando me iniciaba en la programación y una idea me cautivó; creo que es algo fundamental en mí.

Era muy común que en las primeras clases de programación (en mi caso, en C) te enseñaran algunos ejercicios como la sucesión de Fibonacci, cuyo cálculo se realiza mediante un ciclo y una variable que se actualiza en cada iteración.

Y aunque este método es intuitivo y su finalidad es didáctica, recuerdo haber encontrado **la fórmula de Binet**, que en esencia es un modelo que usa la constante phi y te permite calcular términos de la serie de manera **instantánea**.

Aunque tiene sus tecnicismos referentes a la precisión según el tipo de variable u objeto que se use, esta fue la primera vez que **entendí que rara vez el camino más intuitivo es el más eficiente**.

Se debe **buscar un modelo o un comportamiento que describa todos o la mayoría de los casos**, en lugar de llenar todo con if/else.

**Eso es lo que debía implementar para la animación de este portafolio**.

Aquí, un ejemplo de la función de mi repositorio [GitHub - viccg93/fibonacci_binet · GitHub](https://github.com/viccg93/fibonacci_binet):

```rust
//usa formula de Binet con PHI
fn imprimir_serie_fibonacci_PHI(max_iteracion: u32){
    //la formula de Binet requiere n=0 como inicial.
    //el rango no toma el limite superior
    for iteracion in 0..max_iteracion {
        // se requiere que n o la iteracion sea f64 por concordancia con powf
        let iteracion = iteracion as f64;
        let result = (PHI.powf(iteracion) - (1.0 - PHI).powf(iteracion)) / f64::sqrt(5.0);
        println!("[{}]", result as u64);
    }
}

//posterior implementacion con Kahan-Babuska en las operaciones con f64.
```

## Condiciones

Al pensar en las partículas viajando en el canvas como un tiro parabólico, ya tenía una parte del trabajo resuelta, puesto que ya existen las fórmulas del modelo; ahora solo tenía que traducirlas a mis condiciones, que eran las siguientes:

- El eje X en el canvas tiene la misma dirección que en un plano cartesiano.

- El eje Y está invertido: la parte visible comienza en 0 y, a medida que avanza (hacia abajo), incrementa hasta ser igual al height del canvas.

- Usaría el modelo del tiro parabólico con t como deltaTime, que sería el tiempo transcurrido desde el inicio de la animación, usando timestamps.

- Las partículas debían nacer en el espacio no visible inferior al canvas, y tener un ángulo y una velocidad que garantizaran que fueran visibles en su trayectoria.

- La velocidad máxima se calcularía despejando el modelo del tiro parabólico, usando el desplazamiento entre el punto de nacimiento de la partícula y el inicio del eje Y del canvas (altura máxima).

- La velocidad de la partícula, entonces, se calcularía restando un valor pseudoaleatorio dentro de un rango seleccionado, lo que haría que tuvieran variación.

**Así comencé con el trabajo en el módulo physics.mjs**.

## El punto de inicio no es uno

Me di cuenta de que ya estaba definiendo **reglas** que se conectaban con las particularidades de la tecnología.

Pero, de manera aún más interesante, ya estaba definiendo características que debía tener el pequeño motor que quería crear: **un motor que produjera una animación de objetos volando por todas partes**.

Ya tenía una idea de lo que quería, ya estaba definiendo reglas y ya estaba viendo posibles dificultades y posibilidades de solución. Todo al mismo tiempo.

En contraste con lo que vería el usuario, el motor **funcionaría usando principios de física y modelos que lo rigieran todo (casi de forma minimalista)**.

Sabía que ese movimiento tenía que estar encerrado en el corazón de las líneas de código, dictando lo que para el espectador solo sería una animación divertida (y confío en ello).

---

En otro post pueden encontrar cómo fue el proceso de la física.
