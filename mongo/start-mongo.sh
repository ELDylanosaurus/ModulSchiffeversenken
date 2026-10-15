#!/bin/sh
# Startet die MongoDB für den Schildgenerator auf Port 2021.
# Aufruf auf der VM:  sh mongo/start-mongo.sh

NAME=theship-mongo
DIR="$(cd "$(dirname "$0")" && pwd)"

if docker ps -a --format '{{.Names}}' | grep -qx "$NAME"; then
    echo "Container $NAME existiert schon -> starte ihn"
    docker start "$NAME"
else
    # mongo:4.4 läuft auch auf CPUs ohne AVX (neuere Versionen nicht)
    docker run -d \
        --name "$NAME" \
        --restart unless-stopped \
        -p 2021:27017 \
        -e MONGO_INITDB_ROOT_USERNAME=admin \
        -e MONGO_INITDB_ROOT_PASSWORD=admin1234 \
        -v "$DIR/init-theship.js:/docker-entrypoint-initdb.d/init-theship.js:ro" \
        mongo:4.4
fi

echo "Warte bis MongoDB bereit ist ..."
for i in $(seq 1 30); do
    if docker exec "$NAME" mongo --quiet \
        "mongodb://theship:theship1234@127.0.0.1:27017/theshipdb" \
        --eval 'db.runCommand({ ping: 1 }).ok' 2>/dev/null | grep -q 1; then
        echo "MongoDB läuft auf Port 2021, Login theship/theship1234 klappt"
        exit 0
    fi
    sleep 2
done

echo "MongoDB antwortet nicht - Logs:"
docker logs --tail 30 "$NAME"
exit 1
