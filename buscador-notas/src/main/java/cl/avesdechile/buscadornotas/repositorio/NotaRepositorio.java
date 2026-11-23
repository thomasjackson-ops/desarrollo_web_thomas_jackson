package cl.avesdechile.buscadornotas.repositorio;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import cl.avesdechile.buscadornotas.modelo.Nota;

public interface NotaRepositorio extends JpaRepository<Nota, Integer> {

    // Devuelve null si el avistamiento todavia no tiene ninguna nota (AVG
    // de cero filas da null en SQL, no 0, hay que tener cuidado con eso
    // haber si despues alguien asume que null es lo mismo que cero).
    @Query("SELECT AVG(n.nota) FROM Nota n WHERE n.avistamientoId = :avistamientoId")
    Double promedioPorAvistamiento(@Param("avistamientoId") Integer avistamientoId);
}
