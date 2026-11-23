package cl.avesdechile.buscadornotas.modelo;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// Mapea la tabla comuna tal cual la crea tarea2.sql (de la tarea 2). Solo
// necesito el nombre para esta tarea, asi que no mapeo la relacion con
// region, no la uso para nada aca.
@Entity
@Table(name = "comuna")
public class Comuna {

    @Id
    private Integer id;

    private String nombre;

    public Integer getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }
}
