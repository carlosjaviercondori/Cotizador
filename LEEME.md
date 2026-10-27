# Cotizador Dayplas

## Cómo usarlo

1. Hacé doble clic en **Abrir Cotizador.bat**.
2. Completá la fecha, el cliente, CUIT, dirección y vendedor.
3. Agregá productos con **Agregar fila**. Para quitar una fila, usá la **×** al final.
4. La aplicación calcula automáticamente el total de cada línea y el total general.
5. Elegí **Generar cotización** para abrir la ventana de impresión. Desde allí podés imprimir o seleccionar **Guardar como PDF**.
6. Cada cotización generada queda guardada en **Historial de cotizaciones**. Usá **Editar** para volver a cargarla, modificarla y guardarla con **Actualizar y generar**. Usá **Eliminar** para quitarla del historial.

Los datos se guardan automáticamente en el navegador de esa computadora para no perder una cotización si se cierra la ventana. El botón **Limpiar** elimina el borrador actual y empieza una nueva cotización; no borra el historial.

El historial se guarda localmente en el navegador. Si se borran los datos del navegador o se utiliza otra computadora, las cotizaciones guardadas no estarán disponibles allí.

## Archivos

- `index.html`: pantalla principal.
- `styles.css`: diseño de la aplicación y formato de impresión.
- `app.js`: filas, cálculos y guardado automático.
- `image2.png`: logo de la empresa extraído del modelo original.

### Detalles a agregar:

* [X] generar una carpeta donde se guarden todas las cotizaciones editables
* [ ] al editar una cotizacion no se debe reemplazar
* [ ] eliminar filas vacias o impedir que se genere cotizacion con datos incompletos
* [X] crear una base de datos de clientes para autocompletar los datos
* [X] corregir la convercion a pdf para que no se modifique la posicion de los datos
