package cl.avesdechile.buscadornotas.modelo;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "voluntario")
public class Voluntario {

    @Id
    private Integer id;

    private String nombre;

    // Lazy porque la mayoria de las veces solo queremos el nombre del
    // voluntario, no toda la cadena hasta comuna. Hibernate lo trae solo
    // cuando alguien llama getComuna().
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comuna_id")
    private Comuna comuna;

    public Integer getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public Comuna getComuna() {
        return comuna;
    }
}
