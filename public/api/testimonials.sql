CREATE TABLE testimonios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  distrito VARCHAR(120) NOT NULL,
  resena TEXT NOT NULL,
  puntuacion TINYINT NOT NULL DEFAULT 5,
  estado ENUM(''pendiente'',''aprobado'',''rechazado'') NOT NULL DEFAULT ''pendiente'',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
