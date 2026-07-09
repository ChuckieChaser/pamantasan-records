# Configurations

This file here serves as the configuration done on the second laptop (server side)

## Docker Compose YML File

```
version: '3.8'

services:
  postgres-db:
    image: pgvector/pgvector:pg18
    container_name: pamantasan_records_container
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin
      POSTGRES_DB: pamantasan_records
    ports:
      - "5433:5432"
    volumes:
      - D:/records/data:/var/lib/postgresql
```

I also hook it up on the pgAdmin 4 server connection whatever that is

---

## Ollama Configuration

I just set up the environment variable on the laptop

- Variable Name : `OLLAMA_HOST`
- Variable Value: `0.0.0.0`

- Variable Name : `OLLAMA_MODELS`
- Variable Value: `D:\records\models`

For added benefit, I also gone ahead and tweak the default model storage location directly to that folder in the ollama app settings

---

## Firewall

I set the inbound of the firewall to allow remote connections

- Port: 5000 TCP (Node)
- Port: 5433 TCP (Postgres)

## Dedicated Folder

D:/records/documents - for uploaded documents (they must be obfuscated via their uuid)

D:/records/avatars - for avatar of the users

D:/records/data - postgres data

D:/records/models - ollama models