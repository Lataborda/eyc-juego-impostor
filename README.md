# Juego del impostor

Herramienta de clase del curso Etnografía y Campesinado (5008868), Universidad Nacional de Colombia, Sede Palmira, semestre 2026-2. Sesión 7, viernes 9 de octubre de 2026. Ética del encuentro y política de la etnografía.

El juego se conduce en un solo celular por grupo. Los conceptos provienen de Restrepo, capítulo 4, y de Freire, *¿Extensión o comunicación?*. La página registra quién jugó, el rol de cada persona en cada ronda y los puntajes en una hoja de Google Sheets.

## Direcciones

- Página pública: https://lataborda.github.io/eyc-juego-impostor/
- Aplicación web de Apps Script: https://script.google.com/macros/s/AKfycbzqb1My_f40bmkfnCuJ5K5Bw9h26pPBYdCYGRdluIXQ7s9KZRsiv430tJ5FGpKEurAZ/exec (constante `URL_SCRIPT` de `index.html`).
- Hoja de cálculo: "EyC_2026-2_Juego del impostor", en el Google Drive del profesor. Su dirección no se publica en este repositorio, porque el repositorio es público y la hoja contiene la lista de estudiantes.

## Archivos

- `index.html`. Página completa del juego, con HTML, CSS y JavaScript internos.
- `Codigo.gs`. Apps Script de la hoja de cálculo. Las instrucciones de instalación están al inicio del archivo.
- `README.md`. Este documento.

La lista de estudiantes no está en el repositorio. Se importa a mano en la hoja Estudiantes.

## Configuración de la página

Al inicio del código de `index.html` están las constantes del juego.

- `URL_SCRIPT`. Dirección de la aplicación web de Apps Script, terminada en `/exec`. Sin esta dirección el juego funciona igual y muestra el aviso "Sin conexión a la hoja".
- `PUNTOS`. Valores del puntaje.
- `CONCEPTOS`. Nombre, fuente, definición y concepto de contraste de cada concepto.
- `CURSO`, `SESION` y `ACTIVIDAD`. Valores fijos de los envíos.

## Instalación de la hoja y del Apps Script

1. Crear una hoja de cálculo nueva llamada "EyC_2026-2_Juego del impostor", con la misma cuenta de Google del registro de la sesión 6.
2. Abrir Extensiones, Apps Script. Borrar el contenido del editor, pegar `Codigo.gs` y guardar.
3. Escoger la función `configurar` en la barra del editor y pulsar Ejecutar. Autorizar los permisos. Si Google advierte que la aplicación no está verificada, entrar por la opción avanzada y continuar.
4. Abrir Implementar, Nueva implementación, Aplicación web. Ejecutar como Yo. Quién tiene acceso, Cualquier usuario. Copiar la dirección que termina en `/exec`.
5. Pegar esa dirección en `URL_SCRIPT`, dentro de `index.html`, y publicar el cambio en GitHub.
6. Abrir la hoja Estudiantes. Escoger Archivo, Importar, Subir, y subir `estudiantes.csv`. En Ubicación de importación, escoger Reemplazar la hoja actual.

## Nueva implementación del Apps Script

Un cambio en `Codigo.gs` no llega a la aplicación web hasta que se publica una versión nueva.

1. Pegar el código nuevo en el editor de Apps Script y guardar.
2. Abrir Implementar, Gestionar implementaciones.
3. Editar la implementación activa con el ícono de lápiz.
4. En Versión, escoger Nueva versión y pulsar Implementar.

Así la dirección `/exec` no cambia y la página sigue conectada. Si se crea una implementación nueva con Nueva implementación, la dirección cambia. En ese caso hay que actualizar la página.

1. Copiar la dirección nueva, terminada en `/exec`.
2. Pegarla en `URL_SCRIPT`, al inicio del código de `index.html`, y en la sección Direcciones de este documento.
3. Hacer commit y push a la rama `main`. GitHub Pages publica el cambio en uno o dos minutos.
4. Abrir la página publicada con la casilla "Juego de prueba" marcada y revisar que la barra superior muestre "Registros pendientes: 0" al terminar una ronda.

## Uso en clase

1. Cada grupo abre la página pública en un celular.
2. El grupo escoge su letra (A, B, C o D) y escribe nombre y apellido de cada participante, como aparecen en la lista del curso. El juego admite entre 3 y 10 participantes.
3. El celular pasa de mano en mano. Cada persona ve su pantalla en privado y la oculta.
4. El grupo da dos vueltas de pistas, discute un minuto y acusa por consenso.
5. La página revela el concepto, el concepto de contraste y el puntaje de la ronda.
6. Al final, la página muestra la clasificación y permite descargar un respaldo en CSV.

La casilla "Juego de prueba" marca los registros con la actividad "prueba". Esos registros no cuentan en Puntajes ni en Participación.

Si la conexión falla, la página guarda los registros en el celular y los reintenta cada 15 segundos. La barra superior muestra el número de registros pendientes. Si la página se recarga, el juego se retoma en el punto en que estaba, sin mostrar la pantalla privada.

## Puntaje

| Situación | Impostor | Cada uno de los demás |
|---|---|---|
| El grupo acusa al impostor y el impostor no adivina el concepto | −1 | +1 |
| El grupo acusa al impostor y el impostor adivina el concepto | +1 | 0 |
| El grupo acusa a otra persona | +2 | −1 |

## Hojas de la hoja de cálculo

- Participantes. Una fila por participante al iniciar cada juego.
- Registro. Una fila por participante en cada ronda, con rol, concepto, acusado, resultado y puntos.
- Puntajes. Fórmula QUERY que suma los puntos por grupo y nombre, sin los registros de prueba.
- Estudiantes. Lista del curso, con las columnas Nombre y Programa. Se llena a mano.
- Participación. Se crea con el menú "Juego del impostor", opción "Actualizar participación".

## Participación

La opción "Actualizar participación" compara cada nombre registrado con la lista de Estudiantes. La comparación usa minúsculas, quita tildes y signos y reduce los espacios repetidos. Hay coincidencia cuando todas las palabras escritas en el juego aparecen en el nombre de la lista, con un mínimo de dos palabras.

La hoja muestra, por estudiante, si participó, el número de juegos, las rondas jugadas, el puntaje total y el nombre registrado. Debajo, bajo el título "Nombres sin coincidencia", aparecen los nombres que no coinciden con nadie de la lista y los que coinciden con más de un estudiante. Esos casos requieren revisión manual.

## Datos personales

La página no pide documentos de identidad ni correos. No tiene inicio de sesión. Los nombres viajan solo a la hoja de cálculo del profesor.

## Referencias

- Freire, P. (1973). *¿Extensión o comunicación? La concientización en el medio rural*. Siglo XXI Editores.
- Restrepo, E. *Etnografía. Alcances, técnicas y éticas* (edición revisada y ampliada). Fondo Editorial UNCP. Capítulo 4, Consideraciones éticas.
