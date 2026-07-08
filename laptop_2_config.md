# Docker Compose YML File

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
      - D:/records/documents:/var/lib/postgresql/data
```

I also hook it up on the pgAdmin 4 server connection whatever that is

---

# Ollama Configuration

I just set up the environment variable on the laptop

- Variable Name : `OLLAMA_HOST`
- Variable Value: `0.0.0.0`

To ensure your Ollama models are saved to your dedicated D: drive folder, add this new environment variable as well:

- Variable Name : `OLLAMA_MODELS`
- Variable Value: `D:\records\models`

*(Note: You will need to restart the Ollama background service/app for this to take effect!)*

