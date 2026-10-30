# Why Bother?

Obra para la Unidad 8 de Simulación (2026-20). La pregunta era *¿para qué tomarse el trabajo?* y esta es mi forma de responderla.

Hay dos lados. En el de la izquierda los agentes se mueven libres, como en bandada, y cada uno hace lo suyo. En el de la derecha (el lado IA) se mueven rígidos y solo copian lo que ven del otro lado. Con el tiempo los agentes se van pasando a la derecha porque es más fácil, y al cruzar siguen teniendo su color pero dejan de decidir. Se pueden traer de vuelta con el mouse, aunque cuesta, y los que vuelven se convierten en una pieza única: una flor, un copo de nieve, un girasol o una nota musical. Ninguna sale igual a otra.

## Cómo verla

Se presenta con el teclado:

- `0` portada
- `1` lado humano
- `2` lado IA
- `3` el atajo (los agentes empiezan a cruzar)
- `4` rescatarlos: clic sostenido sobre el lado IA y arrastrar a la izquierda
- `5` final si nadie hace nada
- `6` final si alguien sí lo hace: pasar el cursor por encima (si se oprime `6` otra vez los recorre todos solo)
- `7` la pregunta y la respuesta

Las flechas también sirven para avanzar y retroceder. `H` esconde los textos y `R` reinicia. Si se devuelve a una escena anterior, todo arranca de cero.

Para probarla en el computador hay que abrir una terminal en la carpeta, correr `python -m http.server` y entrar a `http://localhost:8000`. Con doble clic en el `index.html` no funciona.

## Qué usé del curso

- Ruido de Perlin para que los agentes humanos deambulen (unidad 1).
- Vectores y fuerzas: el atajo es una fuerza que los atrae y el rescate es otra fuerza contra su resistencia (unidades 2 y 3).
- Partículas para las estelas y las piezas (unidad 5).
- Bandada de Reynolds y comportamientos de dirección (unidad 6). Los agentes rígidos no usan fuerzas: van en línea recta a su casilla.
- Para las piezas: la curva rosa `r = cos(kθ)` para las flores, simetría de 6 brazos para los copos y el ángulo áureo para los girasoles.
- three.js. Casi todo se ve plano y el 3D solo aparece cuando un agente se vuelve único.

## Archivos

- `js/guion.js` todos los textos que salen en pantalla
- `js/escenas.js` qué pasa en cada tecla
- `js/mundo.js` los agentes, las copias del lado IA y el dibujo
- `js/comportamientos.js` las fuerzas y la bandada
- `js/piezas.js` las piezas únicas
- `js/ruido.js` ruido de Perlin
- `BITACORA.md` el proceso

## Créditos

La idea, el diseño y las decisiones son míos. El código lo generé con Claude a partir de ese diseño, que es justamente de lo que habla la obra.
