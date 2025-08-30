import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const analyze = async (fen: string, depth: number) => {
    try {
        var res = await fetch(`http://localhost:4000/positions/${encodeURIComponent(fen)}`);
        if (!res.ok) {
            console.log("pas trouve")
            res = await fetch("http://localhost:4000/analyse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fen, depth }),
            });
        }
        const data = await res.json();
        const trait = fen.split(" ")[1];
        var score = 50;
        //console.log(data);

        if (data.mate !== null) {
            score = trait === "w" ? 10 : -10;
            if (data.mate <= 0) {
                score = -score;
            }



        } else {

            score = data.score !== null
                ? (data.score) / 100
                : (data.mate !== null) ? data.mate : 0;


            score = Math.round(score * 100) / 100;
        }
        //console.log(score, data.score);

        score = Math.max(-10, score);
        score = Math.min(10, score);
        return score
    } catch (err) {
        console.error(err);
        return 50;
    }
};

interface EvaluationGraphProps {
    fens: string[];
}

const EvaluationGraph: React.FC<EvaluationGraphProps> = ({ fens }) => {
    const [data, setData] = useState<{ move: number; eval: number }[]>([]);
    const [whiteAccuracy, setWhiteAccuracy] = useState<number | null>(null);
    const [blackAccuracy, setBlackAccuracy] = useState<number | null>(null);

    useEffect(() => {
        if (fens.length === 0) return;

        const runAnalysis = async () => {
            const results: { move: number; eval: number }[] = [];

            for (let i = 0; i < fens.length; i++) {
                const score = await analyze(fens[i], 25);
                results.push({ move: i + 1, eval: score });
            }

            setData(results);

            // --- calcul précision simple ---
            let whiteLoss = 0, blackLoss = 0, whiteMoves = 0, blackMoves = 0;

            for (let i = 1; i < results.length; i++) {
                const prevEval = results[i - 1].eval;
                const currentEval = results[i].eval;

                const diff = (currentEval < prevEval) ? prevEval - currentEval : 0;


                //console.log(diff);
                if (i % 2 === 1) { // Blanc joue aux coups impairs
                    whiteLoss += diff;
                    whiteMoves++;
                } else {
                    blackLoss += diff;
                    blackMoves++;
                }
            }

            const whiteAcc = 100 * (1 - (whiteLoss / (whiteMoves)));
            const blackAcc = 100 * ((blackLoss / (blackMoves)));

            setWhiteAccuracy(whiteAcc);
            setBlackAccuracy(blackAcc);
        };

        runAnalysis();
    }, [fens]);

    return (
        <div>
            <div style={{ width: "100%", height: 300, display: "flex", flexDirection: "row" }}>

                <div style={{ marginTop: 20 }}>
                    <h2>game analysis</h2>
                    <p>Précision Blancs : {whiteAccuracy?.toFixed(1)}%</p>
                    <p>Précision Noirs : {blackAccuracy?.toFixed(1)}%</p>
                </div>
                <div style={{ width: "100%" }}>
                    <ResponsiveContainer>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="move" label={{ value: "Coup", position: "insideBottom", offset: -5 }} />
                            <YAxis domain={[-2, 2]} label={{ value: "Évaluation", angle: -90, position: "insideLeft" }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="eval" stroke="#007bff" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

            </div>
        </div>
    );
};

export default EvaluationGraph;
