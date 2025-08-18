"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = exports.positions = exports.db = void 0;
exports.connectDB = connectDB;
const mongodb_1 = require("mongodb");
const uri = "mongodb://127.0.0.1:27017"; // ⚡️ ton serveur Mongo local
const client = new mongodb_1.MongoClient(uri);
async function connectDB() {
    try {
        await client.connect();
        console.log("✅ MongoDB connecté !");
    }
    catch (err) {
        console.error("❌ Erreur connexion MongoDB :", err);
    }
}
// Accès rapide à la base et collection
exports.db = client.db("chessdb"); // nom de ta BDD
exports.positions = exports.db.collection("Positions"); // collection "feuilles"
exports.users = exports.db.collection("users"); // collection pour les utilisateurs
//# sourceMappingURL=db.js.map