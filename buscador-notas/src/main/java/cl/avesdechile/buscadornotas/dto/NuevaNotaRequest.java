package cl.avesdechile.buscadornotas.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

// Lo que manda el JS cuando alguien evalua un avistamiento. @Min/@Max ya
// rechazan solos cualquier valor fuera de 1-7 antes de que el controlador
// tenga que preocuparse de eso (y si mandan texto en vez de numero, Jackson
// ni siquiera alcanza a construir el objeto, tira 400 de entrada).
public record NuevaNotaRequest(
        @NotNull(message = "Falta la nota")
        @Min(value = 1, message = "La nota debe ser un numero entre 1 y 7")
        @Max(value = 7, message = "La nota debe ser un numero entre 1 y 7")
        Integer nota
) {
}
