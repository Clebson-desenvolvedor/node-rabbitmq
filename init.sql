CREATE USER admin WITH PASSWORD 'adminpassword';

ALTER USER admin WITH SUPERUSER;

CREATE DATABASE mydb OWNER admin;

\connect mydb;

CREATE TABLE IF NOT EXISTS eventos_processados (
    id SERIAL PRIMARY KEY,
    tipo_evento VARCHAR(50),
    payload JSONB,
    status VARCHAR(20) DEFAULT 'pendente',
    tentativas INT DEFAULT 0,
    erro TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processado_em TIMESTAMP
);

GRANT ALL PRIVILEGES ON DATABASE mydb TO admin;