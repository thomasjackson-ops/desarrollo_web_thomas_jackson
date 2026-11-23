package cl.avesdechile.buscadornotas.controlador;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import cl.avesdechile.buscadornotas.dto.NuevaNotaRequest;
import cl.avesdechile.buscadornotas.dto.PromedioResponse;
import cl.avesdechile.buscadornotas.modelo.Nota;
import cl.avesdechile.buscadornotas.repositorio.AvistamientoRepositorio;
import cl.avesdechile.buscadornotas.repositorio.NotaRepositorio;
import jakarta.validation.Valid;

@RestController
public class NotaController {

    private final NotaRepositorio notaRepositorio;
    private final AvistamientoRepositorio avistamientoRepositorio;

    public NotaController(NotaRepositorio notaRepositorio, AvistamientoRepositorio avistamientoRepositorio) {
        this.notaRepositorio = notaRepositorio;
        this.avistamientoRepositorio = avistamientoRepositorio;
    }

    @PostMapping("/api/avistamientos/{id}/notas")
    public PromedioResponse agregarNota(@PathVariable Integer id, @Valid @RequestBody NuevaNotaRequest cuerpo) {
        // Si mandan un id de avistamiento que no existe, no tiene sentido
        // dejar que se guarde una nota huerfana (ademas la FK la rechazaria igual).
        if (!avistamientoRepositorio.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ese avistamiento no existe");
        }

        notaRepositorio.save(new Nota(id, cuerpo.nota()));

        Double promedio = notaRepositorio.promedioPorAvistamiento(id);
        return new PromedioResponse(promedio);
    }

    // Las anotaciones @Min/@Max del DTO ya filtran casi todo, pero si de
    // todas formas llega algo invalido (nota=null, nota=99, etc.) el
    // handler por defecto de spring devuelve un error 400 enorme y feo;
    // acá lo dejamos simple y legible para el que esta probando la api.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> manejarValidacion(MethodArgumentNotValidException ex) {
        String mensaje = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Nota invalida");
        return Map.of("error", mensaje);
    }

    // Esto salta cuando mandan algo que ni siquiera se puede parsear como
    // numero (ej: {"nota": "abc"}) — ahi Jackson falla antes de llegar a las
    // anotaciones @Min/@Max, asi que lo atrapamos aparte para no devolver el
    // error gigante por defecto de spring.
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> manejarJsonInvalido(HttpMessageNotReadableException ex) {
        return Map.of("error", "La nota debe ser un numero entre 1 y 7");
    }
}
