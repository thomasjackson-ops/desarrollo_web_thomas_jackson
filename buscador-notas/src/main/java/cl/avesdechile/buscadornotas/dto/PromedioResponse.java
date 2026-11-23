package cl.avesdechile.buscadornotas.dto;

// Respuesta del POST de una nota nueva: el promedio recalculado, para que
// el JS solo tenga que pintarlo y no andar sumando nada por su cuenta.
public record PromedioResponse(Double promedio) {
}
