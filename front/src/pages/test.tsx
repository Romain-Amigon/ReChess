import React, { useState } from "react";
import Bar from "../code/EvaluationBar";
import Engine from "../code/engine";

import EngineAnalysis from "../code/Evaluation";
const Test: React.FC = () => {
    const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    const [depth, setDepth] = useState(15);
    const [bestMove, setBestMove] = useState<string | null>(null);
    const [score, setScore] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);


    const [engine, setEngine] = useState(new Engine);
    // Normalisation du score pour l'affichage (max ±10)
    const normalizedScore = score ? Math.max(5, Math.min(95, ((score ? score / 100 : 100) + 4) / 8 * 100)) : 0;


    return (
        <div style={{ padding: 20, fontFamily: "sans-serif" }}>
            <h1>Analyse d'échecs</h1>
            <textarea
                rows={2}
                cols={50}
                value={fen}
                onChange={(e) => setFen(e.target.value)}
            />
            <br />
            <input
                type="number"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                min={1}
                max={30}
            />


            {(
                <div style={{ marginTop: 20 }}>

                    <Bar fen={fen} depth={22} />


                </div>

            )
            }
        </div >
    );
};

export default Test;
