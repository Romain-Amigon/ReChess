import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import { join } from "path";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/analyse", (req, res) => {
    const { fen, depth } = req.body;
    const engine = spawn(join(__dirname, "../public/stockfish.exe"));

    let output = "";
    engine.stdout.on("data", (data) => {
        output += data.toString();

        if (output.includes("bestmove")) {
            const matchMove = output.match(/bestmove\s+(\S+)/);
            const matchCp = output.match(/score\s+cp\s+(-?\d+)/);
            const matchMate = output.match(/score\s+mate\s+(-?\d+)/);

            engine.kill();

            res.json({
                bestmove: matchMove ? matchMove[1] : null,
                score: matchCp ? parseInt(matchCp[1], 10) : null,
                mate: matchMate ? parseInt(matchMate[1], 10) : null,
            });
            console.log(matchMate);
        }
    });

    engine.stdin.write("uci\n");
    engine.stdin.write("ucinewgame\n");
    engine.stdin.write(`position fen ${fen}\n`);
    engine.stdin.write(`go depth ${depth || 15}\n`);
});

app.listen(4000, () => console.log("API Stockfish sur http://localhost:4000"));
