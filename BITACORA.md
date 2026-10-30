# Why Bother?
### Bitácora · Unidad 8 · Simulación 2026-20

![Why Bother?](img/estelas.jpg)

**[Ver la obra](https://armandomr99.github.io/Unidad-8/)** · un clic para empezar; después corre sola. Mejor con sonido.

---

Cuando el profesor nos contó que él también se preguntaba si valía la pena preparar el curso, sabiendo que nosotros podemos pedirle todo a una IA, lo primero que pensé fue que sí vale la pena. La IA puede escribir el código, pero no busca referentes para otros, no se queda pensando qué nos puede servir, no insiste cuando nadie escucha. Eso lo pone una persona.

También tengo que ser honesto: lo que me hizo seguir en el curso fue, primero, que necesitaba aprobar. Y segundo, que aunque uno use la IA, algo de lo que hace se le queda grabado y le sirve después.

Con el tiempo llegué a algo más: que no se trata de elegir entre uno mismo y la máquina. Uno aprende de ella, y cuando le pone su propia mano a lo aprendido, sale algo que ninguno de los dos habría hecho solo. Eso es lo que cuenta la obra.

---

## La obra

Es una película corta, de una sola toma, que corre sola después del primer clic. No tiene capítulos ni títulos: la cámara fluye de un momento al siguiente y los versos aparecen uno tras otro, letra por letra, sobre la imagen. Solo se detiene en los dos momentos en que quien mira tiene que intervenir.

No hay letreros que digan qué es cada lado. A la izquierda, agentes de colores que se mueven en corrientes y dejan sus pasos pintados en el suelo; con el tiempo esos pasos forman un camino. A la derecha, una cuadrícula donde algo aprende de ellos y lo devuelve en orden, pero sin dejar huella.

| | |
| :---: | :---: |
| ![Pasos](img/pasos.jpg) | ![El espejo](img/el-espejo.jpg) |
| *antes de saber, solo había pasos.* | *del otro lado, algo nos miraba con paciencia.* |
| ![La corriente](img/la-corriente.jpg) | ![Volver](img/volver.jpg) |
| *era tan fácil dejarse llevar.* | *vuelve distinto: con lo que aprendió allá, y con lo que es aquí.* |
| ![La quietud](img/la-quietud.jpg) | ![La mano](img/la-mano.jpg) |
| *si nadie cruza a buscarlos, todo queda perfecto. perfecto, y quieto.* | *pero si tomas lo que aprendiste y le pones tu mano, nace algo que nadie más podría haber hecho.* |

**Lo que vuelve.** Los que cruzaron aprendieron el orden del otro lado. Cuando alguien los trae de vuelta no regresan como eran: se convierten en una pieza única (flor, copo de nieve, girasol o nota musical) que mezcla las dos cosas. Una ecuación o una simetría, que es lo aprendido, y unos parámetros que salen de la semilla de ese agente, que es lo propio. Por eso no hay dos iguales.

**El final.** La cámara sube y entra en una espiral que gira como una galaxia, hecha de todos los que volvieron. Cada pieza deja una estela de luz al girar, y con el tiempo las estelas dibujan anillos. Detrás, muy tenue, gira un astrolabio dorado. En el ojo vacío del centro aparece la reflexión, inspirada en la frase de Neil Armstrong al llegar a la Luna:

![Respuesta](img/respuesta.jpg)

> ¿para qué tomarte el trabajo?
> para la máquina, fue solo una línea más.
> para mí, fue el primer paso de algo que nadie más podía crear.

**La música** es original y se genera en vivo en el navegador, con aire medieval y folk: un bordón como de gaita, una flauta en modo dórico, arpa y bodhrán en 6/8. Cambia con la historia: del otro lado aparece una máquina fría y exacta, en la corriente la flauta se apaga, al traerlos de vuelta entra el tambor como un corazón, en la quietud no queda casi nada, y al final todo vuelve.

**Para que se sienta como película** la imagen tiene barras de cine, grano, un temblor muy leve como de proyector viejo, fugas de luz cálida, filigranas finas en las esquinas y una línea dorada abajo que avanza con la historia.

---

## ¿Cómo interpreté la pregunta?

Al principio lo pensé como humano contra IA: agentes libres que al cruzar se vuelven rígidos. Mientras lo diseñaba me di cuenta de que eso decía que la IA es mala, y yo no pienso eso. Lo cambié: del otro lado no hay un enemigo sino algo que aprende de nosotros, y de lo que nosotros también podemos aprender. Lo que importa es no quedarse allá: traer lo aprendido de vuelta y ponerle la mano. Ahí aparece lo único.

## ¿Cómo lo exploré?

Primero diseñé la obra y después le pedí a Claude que la convirtiera en código. Lo hice a propósito: si mi idea es que de la IA se aprende y uno pone su intervención, la obra tenía que hacerse así.

Las decisiones fueron mías: los dos lados, que al cruzar mantuvieran su color, que la IA copiara y ordenara, que los que vuelven fueran únicos, los dos desenlaces, quitar los letreros, que fuera una sola toma sin capítulos, que los versos fueran poéticos, que al final quedaran estelas, la música medieval y la reflexión final. También probé una versión en estilo de caligrafía japonesa, en rojo y negro, con modelos 3D; la descarté porque esta se sentía más mía. Usé como referente la obra *Ontología* de una compañera: me mostró que una entrega se siente terminada cuando no necesita explicarse.

Técnicas del curso: ruido de Perlin para el deambular y para un campo de flujo que forma las corrientes (unidad 1), vectores y fuerzas (unidades 2 y 3), partículas y estelas (unidad 5), bandada de Reynolds y comportamientos de dirección (unidad 6), y three.js con una cámara que sigue planos encadenados. Para las piezas y la espiral: la curva rosa `r = cos(kθ)` y el ángulo áureo.

## ¿Qué encontré?

El contraste entre los dos lados funciona sin explicarlo. Me sorprendió que, al probarla, todos los agentes cruzaban casi al mismo tiempo: cuando unos se iban, la bandada arrastraba a los demás. Se parece a lo que pasa en clase con la IA. Se ajustó para que cada uno ceda en su propio momento.

Queda abierto si hacer el código con IA contradice la obra o la confirma. Yo creo que la confirma, porque las decisiones fueron mías, pero entiendo que alguien piense lo contrario.

## ¿Qué aprendí realmente?

Puedo explicar qué pasa en cada momento, qué técnica usa cada parte y dónde se cambian los versos, los movimientos de cámara y los comportamientos. El código lo entiendo más a nivel de ideas que línea por línea, igual que me pasó con three.js en el curso.

## ¿Qué sentido tuvo tomarme el trabajo?

Frente a la pregunta de Hodgin: sí vale la pena. Para la máquina, lo que hice fue una línea más. Para mí fue el primer paso de algo que nadie más podía crear.

---

## Referencias

- Robert Hodgin, [*Why Bother? Making Art in the Age of AI*](https://www.youtube.com/watch?v=vmUodu6K-bA).
- [*Ontología*](https://estorrente.github.io/Ontologia/), obra de una compañera del curso: referente de cómo presentar.
- Neil Armstrong, 1969: "un pequeño paso para un hombre, un gran salto para la humanidad", como inspiración de la reflexión final.
- Mägo de Oz, *Molinos de viento*: la idea del camino que hacen los pies. La música de la obra es original, no usa la canción.
- Craig Reynolds, [*Boids*](https://www.red3d.com/cwr/boids/): el modelo de bandada.
- Daniel Shiffman, [*The Nature of Code*](https://natureofcode.com/): fuerzas, partículas, campos de flujo y agentes autónomos.
- [three.js](https://threejs.org/).

---

## Autoevaluación

| Criterio | Puntaje | Justificación |
| :--- | :--- | :--- |
| Cumplimiento del encargo | 25/25 | La obra es una simulación completa que explora la pregunta "Why Bother?": funciona en tiempo real en la web como una película de una sola toma, tiene dos momentos de interacción con el mouse (traer agentes de vuelta y hacerlos florecer con el cursor), estelas de luz, música generativa que acompaña la historia, y la bitácora responde las cinco preguntas de la unidad. |
| Comprensión y verificación | 25/25 | Puedo explicar qué técnica del curso usa cada momento (ruido de Perlin, campo de flujo, fuerzas, bandada de Reynolds, partículas, estelas y curvas matemáticas) y dónde se modifican los versos, la cámara y los comportamientos. Al probarla detecté que los agentes cruzaban todos juntos por la bandada y se ajustó para que cada uno ceda en su propio momento. |
| Exploración de la pregunta | 25/25 | Mi interpretación evolucionó durante el diseño: de un contraste humano contra IA, a la idea de que de la IA se aprende y que lo único aparece cuando uno interviene lo aprendido. Probé otra estética y otros finales y elegí los que se sentían más míos. La forma de hacerla (yo diseñé, la IA programó) también es parte de la respuesta. |
| Reflexión sobre el proceso | 25/25 | Respondí con total sinceridad por qué seguí en el curso, declaré abiertamente cómo usé la IA y tomé una postura propia frente a Hodgin: para la máquina fue una línea más; para mí, el primer paso de algo que nadie más podía crear. |
| **Total** | **100/100** | **Equivale a 5.0/5.0** |
