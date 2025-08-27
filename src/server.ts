import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import { join } from "path";
import { connectDB, positions, users } from "./db"; // 🔗 MongoDB

type FeuilleProps = {
    fen: string;
    commentaire: string;
    childs: number[];
};

const app = express();
app.use(cors());
app.use(express.json());

// ------------------- API Analyse avec Stockfish -------------------
app.post("/analyse", async (req, res) => {
    const { fen, depth } = req.body;
    const engine = spawn(join(__dirname, "../public/stockfish.exe"));

    let output = "";
    engine.stdout.on("data", async (data) => {
        output += data.toString();

        if (output.includes("bestmove")) {
            const matchMove = output.match(/bestmove\s+(\S+)/);
            const matchCp = output.match(/score\s+cp\s+(-?\d+)/);
            const matchMate = output.match(/score\s+mate\s+(-?\d+)/);

            engine.kill();

            const trait = fen.split(" ")[1]; // "w" ou "b"

            let score = matchCp ? parseInt(matchCp[1], 10) : 50;
            let mate = matchMate ? parseInt(matchMate[1], 10) : null;

            if (mate !== null) {
                if (mate > 0) {
                    score = trait === "w" ? 1000 : -1000;
                } else {
                    score = trait === "w" ? -1000 : 1000;
                }
            } else {
                score = trait === "b" ? -score : score;
            }


            const result = {
                fen,
                bestmove: matchMove ? matchMove[1] : null,
                score: score,
                mate: mate,
                depth: depth || 15,
            };

            // 🔥 Sauvegarde dans Mongo avec compteur
            await positions.updateOne(
                { fen },
                {
                    $set: result,
                    $inc: { playCount: 1 } // incrémente playCount
                },
                { upsert: true }
            );

            res.json(result);
        }
    });

    engine.stdin.write("uci\n");
    engine.stdin.write("ucinewgame\n");
    engine.stdin.write(`position fen ${fen}\n`);
    engine.stdin.write(`go depth ${depth || 15}\n`);
});

// ------------------- API Utilisateurs -------------------
function mapToObj(map: Map<any, any>): Record<string, any> {
    return Object.fromEntries(
        Array.from(map, ([key, value]) => [
            String(key), // MongoDB impose des clés string
            value instanceof Map ? mapToObj(value) : value,
        ])
    );
}


// Créer un utilisateur
app.post("/users", async (req, res) => {
    const { username, email } = req.body;
    const tree = new Map();
    console.log("Création de l'utilisateur :", username, email);
    tree.set(0, {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",      // position initiale
        commentaire: "",
        childs: [],
    } as FeuilleProps);
    const user = {
        username,
        email,
        createdAt: new Date(),
        tree: mapToObj(tree),
    };
    console.log("Nouvel utilisateur :", user);
    const result = await users.insertOne(user);
    res.json(result);
});

// Récupérer un utilisateur par son username
app.get("/users/:username", async (req, res) => {
    try {
        const user = await users.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }
        res.json(user);
    } catch (err) {
        console.error("❌ Erreur récupération utilisateur :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Récupérer une position par son FEN
app.get("/positions/:fen", async (req, res) => {
    console.log("e", req.params.fen, 'e');
    try {
        const fen = decodeURIComponent(req.params.fen);
        console.log("Recherche position FEN :", fen);
        const pos = await positions.findOne({ fen: fen });
        if (!pos) {
            return res.status(404).json({ error: "position introuvable" });
        }
        res.json(pos);
    } catch (err) {
        console.error("❌ Erreur récupération position :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});


// Récupérer tous les utilisateurs
app.get("/users", async (req, res) => {
    const allUsers = await users.find().toArray();
    res.json(allUsers);
});

// ------------------- API Récupération Positions -------------------
app.get("/positions", async (req, res) => {

    const all = await positions.find().toArray();
    res.json(all);
});


// ------------------- Lancement serveur -------------------
app.listen(4000, async () => {
    await connectDB(); // 🔗 connexion Mongo au lancement
    console.log("🚀 API Stockfish sur http://localhost:4000");
});
