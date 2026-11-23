package cl.avesdechile.buscadornotas.dto;

// DTO de salida del buscador. Lo arma el controlador a partir de un
// Avistamiento + el promedio de nota (que se consulta aparte). Es un
// record simple, no necesita mas logica que guardar los datos.
public record ResultadoBusqueda(
        Integer avistamientoId,
        String voluntario,
        String ave,
        String comuna,
        String dia,
        Double promedioNota
) {
}
