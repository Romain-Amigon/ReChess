import { MongoClient } from "mongodb";

const uri = "mongodb://127.0.0.1:27017"; // ⚡️ ton serveur Mongo local
const client = new MongoClient(uri);

export async function connectDB() {
    try {
        await client.connect();
        console.log("✅ MongoDB connecté !");
    } catch (err) {
        console.error("❌ Erreur connexion MongoDB :", err);
    }
}

// Accès rapide à la base et collection
export const db = client.db("chessdb");        // nom de ta BDD
export const positions = db.collection("Positions"); // collection "feuilles"
export const users = db.collection("users");        // collection pour les utilisateurs
