package cl.avesdechile.buscadornotas.repositorio;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import cl.avesdechile.buscadornotas.modelo.Avistamiento;

public interface AvistamientoRepositorio extends JpaRepository<Avistamiento, Integer> {

    // El patron (%texto%) lo arma el controlador, aca solo lo recibo como
    // parametro para que quede parametrizado de verdad (JPQL no permite
    // concatenar el texto del usuario directo en el query, asi que de
    // paso nos protegemos solos de inyeccion SQL).
    // Busca por ave, por voluntario o por comuna, cualquiera de los 3 que matchee sirve.
    @Query("SELECT a FROM Avistamiento a " +
            "JOIN a.voluntario v " +
            "JOIN v.comuna c " +
            "JOIN a.ave ave " +
            "WHERE LOWER(ave.nombre) LIKE :patron " +
            "OR LOWER(v.nombre) LIKE :patron " +
            "OR LOWER(c.nombre) LIKE :patron " +
            "ORDER BY a.fechaHora DESC")
    List<Avistamiento> buscar(@Param("patron") String patron);
}
