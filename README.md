# Contexto Funcional e Documentação

## Contexto Funcional

Este projeto tem como objetivo processar eventos de pedidos recebidos por uma API HTTP. Cada evento representa uma ação realizada por um usuário, como a criação ou atualização de um pedido. Os eventos são enviados para uma fila RabbitMQ, garantindo que o processamento seja desacoplado e resiliente.

O resultado esperado é que cada evento seja consumido, processado e registrado em uma tabela do PostgreSQL, permitindo o acompanhamento do status e possíveis erros de processamento.

## Arquitetura da solução Proposta

A arquitetura da solução proposta é baseada em três componentes principais:

- API HTTP: Responsável por receber eventos externos e injetá-los na fila RabbitMQ.
- RabbitMQ: Atua como broker de mensagens, garantindo entrega confiável, desacoplamento e resiliência. Utiliza fila principal e Dead Letter Queue para tratamento de falhas.
- Consumidor de Eventos: Serviço que consome eventos da fila, processa e registra o resultado no PostgreSQL.

Essa arquitetura segue o padrão de microserviços, permitindo escalabilidade horizontal (vários consumidores), tolerância a falhas (DLQ), e integração fácil com outros serviços via filas e APIs. Todos os componentes são orquestrados via Docker Compose, facilitando o deploy e o desenvolvimento local.

## Justificativa do Uso do RabbitMQ e Padrões de Integração

O RabbitMQ foi escolhido para garantir a entrega confiável dos eventos, desacoplando o recebimento do evento do seu processamento. Isso permite lidar com picos de carga, reprocessamento de mensagens e tolerância a falhas.

Os design patterns usandos foram Strategy Pattern para permitir diferentes estratégias de processamento em lote e o Observer Pattern para notificar módulos internos sobre o resultado de processamento de eventos.

## Instruções de uso

### Requisitos:
- Docker
- Docker Compose
- Node.js

### Instruções

docker-compose up --build

#### Acessar o painel do RabbitMQ
http://localhost:15672

(usuário e senha: ADMIN)
