"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const child_process_1 = require("child_process");
const path_1 = require("path");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post("/analyse", (req, res) => {
    const { fen, depth } = req.body;
    const engine = (0, child_process_1.spawn)((0, path_1.join)(__dirname, "../public/stockfish.exe"));
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
//# sourceMappingURL=server.js.map