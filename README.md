# Hello Vitals.

A stateful web app to record daily vitals.
Data is stored in a MySQL database.

## Deploy to Nimbella

```
nim project deploy .
```

## Directus

1. Edit the `docker-compose.yaml` to provide the database credentials.
2. Run `docker-compose run --rm directus install --email email@example.com --password d1r3ctu5 --force`
3. Open 'http://localhost:8080`
