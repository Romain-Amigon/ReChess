import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import { join } from "path";
import { connectDB, positions, users } from "./db"; // 🔗 MongoDB
import bcrypt from "bcrypt";


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

            console.log(result)

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
    console.log("Création de l'utilisateur :", username);//, email
    tree.set(0, {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",      // position initiale
        commentaire: "",
        childs: [],
    } as FeuilleProps);
    const user = {
        username,
        //email,
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

// Mettre à jour l'arbre d'un utilisateur
app.patch("/users/:username", async (req, res) => {
    try {
        const { username } = req.params;
        const { tree } = req.body;

        if (!tree || typeof tree !== "object") {
            return res.status(400).json({ error: "Arbre invalide" });
        }

        const updatedUser = await users.findOneAndUpdate(
            { username },
            { $set: { tree } },
            { returnDocument: 'after' } // Use returnDocument: 'after' instead of new: true
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        res.json(updatedUser);
    } catch (err) {
        console.error("❌ Erreur mise à jour utilisateur :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Récupérer une position par son FEN
app.get("/positions/:fen", async (req, res) => {
    //console.log("e", req.params.fen, 'e');
    try {
        const fen = decodeURIComponent(req.params.fen);
        //console.log("Recherche position FEN :", fen);
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

// ------------------- AUTHENTIFICATION -------------------

// Inscription avec mot de passe hashé
app.post("/register", async (req, res) => {
    const { username, password } = req.body;//, email

    if (!username || !password) {//|| !email 
        return res.status(400).json({ error: "Champs manquants" });
    }

    // Vérifier si username déjà utilisé
    const existing = await users.findOne({ username });
    if (existing) {
        return res.status(400).json({ error: "Ce pseudo est déjà pris" });
    }



    // Hacher le mot de passe
    const hash = await bcrypt.hash(password, 10);

    // Arbre par défaut
    const tree = {
        "0": {
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            commentaire: "",
            childs: [],
        }
    };

    const user = {
        username,
        //email,
        passwordHash: hash,
        createdAt: new Date(),
        tree,
    };

    await users.insertOne(user);
    res.status(201).json({ message: "Utilisateur créé avec succès" });
});

// Connexion
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await users.findOne({ username });
    if (!user) {
        return res.status(400).json({ error: "Utilisateur introuvable" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        return res.status(400).json({ error: "Mot de passe incorrect" });
    }

    res.json({
        message: "Connexion réussie",
        user: {
            username: user.username,
            //email: user.email,
            createdAt: user.createdAt,
            tree: user.tree,
        }
    });
});


// ------------------- Lancement serveur -------------------
app.listen(4000, async () => {
    await connectDB(); // 🔗 connexion Mongo au lancement
    console.log("🚀 API Stockfish sur http://localhost:4000");
});
