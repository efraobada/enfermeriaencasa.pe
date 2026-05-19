-- ============================================================
-- Enfermería en Casa — Panel de Personal
-- Ejecutar una sola vez en tu base de datos MySQL
-- ============================================================

CREATE TABLE IF NOT EXISTS personal (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100)  NOT NULL,
  username    VARCHAR(50)   UNIQUE NOT NULL,
  password    VARCHAR(255)  NOT NULL,
  rol         ENUM('admin','enfermera') DEFAULT 'enfermera',
  activo      TINYINT(1)    DEFAULT 1,
  creado_en   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sesiones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  personal_id INT NOT NULL,
  token       VARCHAR(64) UNIQUE NOT NULL,
  expira_en   DATETIME NOT NULL,
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (personal_id) REFERENCES personal(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pacientes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL,
  edad        TINYINT UNSIGNED,
  genero      ENUM('masculino','femenino','otro'),
  dni         VARCHAR(15),
  telefono    VARCHAR(20),
  direccion   TEXT,
  distrito    VARCHAR(100),
  diagnostico TEXT,
  activo      TINYINT(1) DEFAULT 1,
  estado      ENUM('activo','en_tratamiento','dado_de_alta','derivado') NOT NULL DEFAULT 'activo',
  creado_por  INT,
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creado_por) REFERENCES personal(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS signos_vitales (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id         INT NOT NULL,
  personal_id         INT NOT NULL,
  presion_sistolica   SMALLINT UNSIGNED,
  presion_diastolica  SMALLINT UNSIGNED,
  temperatura         DECIMAL(4,1),
  saturacion          TINYINT UNSIGNED,
  medicamentos        TEXT,
  observaciones       TEXT,
  tipo_atencion       VARCHAR(100),
  eliminado           TINYINT(1)    DEFAULT 0,
  registrado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  FOREIGN KEY (personal_id) REFERENCES personal(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS intentos_login (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  ip              VARCHAR(45) NOT NULL,
  username        VARCHAR(50) NOT NULL,
  intentos        TINYINT UNSIGNED DEFAULT 1,
  bloqueado_hasta DATETIME,
  ultimo_intento  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ip_user (ip, username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS turnos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  personal_id INT NOT NULL,
  fecha       DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin    TIME NOT NULL,
  notas       VARCHAR(200),
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (personal_id) REFERENCES personal(id) ON DELETE CASCADE,
  INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cobros (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id   INT NOT NULL,
  personal_id   INT NOT NULL,
  tipo_atencion VARCHAR(100),
  monto         DECIMAL(10,2) NOT NULL,
  metodo_pago   ENUM('efectivo','transferencia','yape','plin','otro') DEFAULT 'efectivo',
  estado        ENUM('pagado','pendiente','cancelado') DEFAULT 'pendiente',
  notas         VARCHAR(200),
  eliminado     TINYINT(1)    DEFAULT 0,
  registrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  FOREIGN KEY (personal_id) REFERENCES personal(id),
  INDEX idx_fecha (registrado_en),
  INDEX idx_paciente (paciente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS testimonios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(120) NOT NULL,
  distrito    VARCHAR(120) NOT NULL,
  resena      TEXT NOT NULL,
  puntuacion  TINYINT UNSIGNED DEFAULT 5,
  estado      ENUM('pendiente','aprobado','rechazado') DEFAULT 'pendiente',
  ip          VARCHAR(45) NULL,
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Usuario administrador inicial
-- Usuario: admin  |  Contraseña: Enfermeria2026!
-- IMPORTANTE: Cambia la contraseña después del primer ingreso
-- ============================================================
INSERT IGNORE INTO personal (nombre, username, password, rol)
VALUES ('Administrador', 'admin',
        '$2y$10$CNB7a64J44IEZrSfGImAc.9V2z1upAlh0RZtz9VN7ObsEwU9Hcnp.', 'admin');

-- ============================================================
-- MIGRACIÓN: Ejecutar solo si ya existe la base de datos
-- (Las columnas se agregan solo si no existen aún)
-- ============================================================
ALTER TABLE signos_vitales ADD COLUMN IF NOT EXISTS eliminado TINYINT(1) DEFAULT 0;
ALTER TABLE cobros         ADD COLUMN IF NOT EXISTS eliminado TINYINT(1) DEFAULT 0;
ALTER TABLE testimonios    ADD COLUMN IF NOT EXISTS ip        VARCHAR(45) NULL;
