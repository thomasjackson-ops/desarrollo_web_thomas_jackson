package cl.avesdechile.buscadornotas.controlador;

import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import cl.avesdechile.buscadornotas.dto.ResultadoBusqueda;
import cl.avesdechile.buscadornotas.modelo.Avistamiento;
import cl.avesdechile.buscadornotas.repositorio.AvistamientoRepositorio;
import cl.avesdechile.buscadornotas.repositorio.NotaRepositorio;

@RestController
public class BuscadorController {

    private static final DateTimeFormatter FORMATO_DIA = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    private final AvistamientoRepositorio avistamientoRepositorio;
    private final NotaRepositorio notaRepositorio;

    public BuscadorController(AvistamientoRepositorio avistamientoRepositorio, NotaRepositorio notaRepositorio) {
        this.avistamientoRepositorio = avistamientoRepositorio;
        this.notaRepositorio = notaRepositorio;
    }

    @GetMapping("/api/avistamientos/buscar")
    public List<ResultadoBusqueda> buscar(@RequestParam(name = "q", defaultValue = "") String texto) {
        String limpio = texto == null ? "" : texto.trim();
        // Si todavia no an escrito nada no tiene sentido traer la tabla completa,
        // asi que de una vez cortamos por acá.
        if (limpio.isEmpty()) {
            return List.of();
        }

        String patron = "%" + limpio.toLowerCase() + "%";
        List<Avistamiento> avistamientos = avistamientoRepositorio.buscar(patron);

        return avistamientos.stream().map(this::aResultado).toList();
    }

    private ResultadoBusqueda aResultado(Avistamiento avistamiento) {
        Double promedio = notaRepositorio.promedioPorAvistamiento(avistamiento.getId());
        return new ResultadoBusqueda(
                avistamiento.getId(),
                avistamiento.getVoluntario().getNombre(),
                avistamiento.getAve().getNombre(),
                avistamiento.getVoluntario().getComuna().getNombre(),
                avistamiento.getFechaHora().format(FORMATO_DIA),
                promedio
        );
    }
}
