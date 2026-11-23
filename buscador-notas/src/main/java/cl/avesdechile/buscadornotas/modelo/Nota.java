package cl.avesdechile.buscadornotas.modelo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// Esta es la unica entidad de la tarea que de verdad se escribe. Mapea
// tabla-nota.sql: cada fila es UNA nota de alguien para un avistamiento,
// el promedio se calcula despues con todas las filas que tenga ese
// avistamiento_id (no guardamos el promedio en ningun lado, se recalcula).
@Entity
@Table(name = "nota")
public class Nota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "avistamiento_id")
    private Integer avistamientoId;

    private Integer nota;

    public Nota() {
    }

    public Nota(Integer avistamientoId, Integer nota) {
        this.avistamientoId = avistamientoId;
        this.nota = nota;
    }

    public Integer getId() {
        return id;
    }

    public Integer getAvistamientoId() {
        return avistamientoId;
    }

    public Integer getNota() {
        return nota;
    }
}
