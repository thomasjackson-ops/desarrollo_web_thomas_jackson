package cl.avesdechile.buscadornotas.modelo;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

// No mapeo lugar ni descripcion porque el buscador de esta tarea no los
// necesita (solo ave, voluntario, comuna y la fecha). Si despues hace
// falta se agregan, pero por ahora prefiero no traer columnas de mas.
@Entity
@Table(name = "avistamiento")
public class Avistamiento {

    @Id
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voluntario_id")
    private Voluntario voluntario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ave_id")
    private Ave ave;

    private LocalDateTime fechaHora;

    public Integer getId() {
        return id;
    }

    public Voluntario getVoluntario() {
        return voluntario;
    }

    public Ave getAve() {
        return ave;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }
}
