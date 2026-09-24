# Mission 3: Kommunikation – Schritt für Schritt

Elyse Terminal und Shangris Station sollen miteinander reden. Jede VM fliegt
mit ihrem Schiff zu **einer** Station und leitet die Nachrichten über Port 5000
an die andere VM weiter.

| | Dylan | Kollege |
|---|---|---|
| VM-IP | `192.168.100.40` | `<KOLLEGEN-IP>` (mit `hostname -I` auf der VM nachschauen) |
| Station | **Elyse Terminal** | **Shangris Station** |
| Flugzeit | ca. 1 Stunde | ca. 3–4 Minuten |

> Alles hier läuft **auf den VMs**, nicht auf dem Laptop. Nur die VMs können
> sich gegenseitig über Port 5000 erreichen.

---

## Schritt 1 – Auf die eigene VM einloggen

Vom Laptop aus (PowerShell):

```bash
ssh ship@<EIGENE-VM-IP>
```

## Schritt 2 – Node.js prüfen (muss 22 oder neuer sein)

```bash
node --version
```

Wenn `command not found` oder eine Version unter `v22`:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git
node --version
```

## Schritt 3 – Repo klonen

```bash
cd ~
git clone https://github.com/ELDylanosaurus/ModulSchiffeversenken.git
cd ModulSchiffeversenken
```

Wenn das Repo schon da ist, stattdessen aktualisieren:

```bash
cd ~/ModulSchiffeversenken
git pull
```

## Schritt 4 – IP der anderen VM austauschen

Auf beiden VMs:

```bash
hostname -I
```

Die `192.168.100.x`-Adresse der **anderen** VM braucht ihr gleich im Befehl.

## Schritt 5 – Starten

**Dylan (Elyse, zuerst starten wegen langer Flugzeit):**

```bash
SHIP_IP=127.0.0.1 node src/missions/mission3.js elyse <KOLLEGEN-IP>
```

**Kollege (Shangris):**

```bash
SHIP_IP=127.0.0.1 node src/missions/mission3.js shangris 192.168.100.40
```

Der Kollege kann auch direkt starten. Sein Schiff wartet dann an der
Shangris Station, bis Elyse da ist. Die Reihenfolge ist egal, das Script
stösst die Kommunikation automatisch neu an.

## Schritt 6 – Laufen lassen und kontrollieren

Im Terminal sollte etwa Folgendes erscheinen:

```
Fliege zu Shangris Station ...
Angekommen, halte Position
[Shangris Station] verbunden
[relay] hört auf Port 5000
[Shangris Station] -> [1,2,3,4]
[Shangris Station] <- ...
[relay] -> 192.168.100.40: ...
```

Im Cockpit (`http://<VM-IP>:2000` im Browser) müssen **beide** Zähler auf
`20s / 20s` hochlaufen. Beide Scripts müssen **gleichzeitig** laufen.

Danach mit `Ctrl+C` beenden.

---

## Wenn's nicht geht

| Meldung | Bedeutung / Lösung |
|---|---|
| `Cannot find module ... Ship.js` | `git pull` machen, alter Stand |
| `WebSocket is not defined` | Node ist zu alt → Schritt 2 |
| `[relay] Peer nicht erreichbar` | Andere VM läuft noch nicht, oder falsche IP. Test: `curl -v http://<ANDERE-IP>:5000/` → `405` heisst erreichbar |
| `nicht verbunden, Nachricht verworfen` | WebSocket zur Station ist noch nicht offen, das Script verbindet sich selbst neu |
| Bleibt bei `Fliege zu ...` hängen | Schiff ist noch unterwegs (Elyse ca. 1 h), einfach warten |
| `EADDRINUSE ... 5000` | Das Script läuft schon in einem anderen Terminal → dort beenden |
