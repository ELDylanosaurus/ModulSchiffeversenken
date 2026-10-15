// Läuft beim allerersten Start des Containers (leeres Datenverzeichnis).
// Der Schildgenerator verbindet sich mit
//   mongodb://theship:theship1234@<VM>:2021/theshipdb
// -> der Benutzer muss in der Datenbank "theshipdb" angelegt sein.
db.getSiblingDB("theshipdb").createUser({
    user: "theship",
    pwd: "theship1234",
    roles: [{ role: "readWrite", db: "theshipdb" }]
});
