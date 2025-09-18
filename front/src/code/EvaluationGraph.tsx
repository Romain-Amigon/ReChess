import React, { useEffect, useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import Engine from "./engine";

type Position = {
    fen: string;
    score: number;
    mate: number | null;
    bestmove: string | null;
    depth: number;
};

interface EvaluationGraphProps {
    fens: string[];
}

const EvaluationGraph: React.FC<EvaluationGraphProps> = ({ fens }) => {
    const [data, setData] = useState<{ move: number; eval: number }[]>([]);
    const [whiteAccuracy, setWhiteAccuracy] = useState<number | null>(null);
    const [blackAccuracy, setBlackAccuracy] = useState<number | null>(null);
    const fenCache = useRef<Map<string, Position>>(new Map()); // Cache for FEN evaluations
    const engineRef = useRef<Engine | null>(null);

    useEffect(() => {
        if (fens.length === 0) return;

        const runAnalysis = async () => {
            // Initialize engine once
            if (!engineRef.current) {
                engineRef.current = new Engine();
            }

            const newData: { move: number; eval: number }[] = [...data];

            // Only analyze new FENs
            for (let i = data.length; i < fens.length; i++) {
                const fen = fens[i];
                let position: Position;

                // Check cache first
                if (fenCache.current.has(fen)) {
                    position = fenCache.current.get(fen)!;
                } else {
                    position = await analyze(fen, 25);
                    fenCache.current.set(fen, position); // Cache the result
                }

                newData.push({ move: i + 1, eval: position.score });
            }

            setData(newData);

            // Calculate accuracies
            let whiteLoss = 0,
                blackLoss = 0,
                whiteMoves = 0,
                blackMoves = 0;

            for (let i = 1; i < newData.length; i++) {
                const prevEval = newData[i - 1].eval;
                const currentEval = newData[i].eval;
                const diff = currentEval < prevEval ? prevEval - currentEval : 0;

                if (i % 2 === 1) {
                    // White's move (odd indices)
                    whiteLoss += diff;
                    whiteMoves++;
                } else {
                    // Black's move (even indices)
                    blackLoss += diff;
                    blackMoves++;
                }
            }

            const whiteAcc = whiteMoves > 0 ? 100 * (1 - whiteLoss / whiteMoves) : 100;
            const blackAcc = blackMoves > 0 ? 100 * (1 - blackLoss / blackMoves) : 100;

            setWhiteAccuracy(whiteAcc);
            setBlackAccuracy(blackAcc);
        };

        runAnalysis();

        // Cleanup engine on component unmount
        return () => {
            if (engineRef.current) {
                engineRef.current.stop();
                engineRef.current = null;
            }
        };
    }, [fens]);

    async function analyze(fen: string, depth: number): Promise<Position> {
        const engine = engineRef.current!;
        const trait = fen.split(" ")[1];

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                engine.stop();
                reject(new Error("Timeout: l'engine n'a pas répondu dans les 60 secondes"));
            }, 60000);

            let lastScore = 0;
            let lastMate: number | null = null;

            const listener = ({
                positionEvaluation,
                bestMove,
                possibleMate,
            }: {
                positionEvaluation?: string;
                bestMove?: string;
                possibleMate?: string;
            }) => {
                if (positionEvaluation !== undefined) {
                    const evalCp = Number(positionEvaluation);
                    lastScore = trait === "w" ? evalCp : -evalCp;
                }

                if (possibleMate !== undefined) {
                    lastMate = Number(possibleMate);
                    lastScore = trait === "w" ? 1000 : -1000;
                }

                if (bestMove) {
                    clearTimeout(timeout);
                    engine.stop();

                    resolve({
                        fen,
                        score: lastScore / 100,
                        mate: lastMate,
                        bestmove: bestMove,
                        depth,
                    });
                }
            };

            engine.onMessage(listener);
            engine.evaluatePosition(fen, depth);
        });
    }

    return (
        <div>
            <div style={{ width: "100%", height: 300, display: "flex", flexDirection: "row" }}>
                <div style={{ marginTop: 20 }}>
                    <h2>Game Analysis</h2>
                    <p>White Accuracy: {whiteAccuracy?.toFixed(1)}%</p>
                    <p>Black Accuracy: {blackAccuracy?.toFixed(1)}%</p>
                </div>
                <div style={{ width: "100%" }}>
                    <ResponsiveContainer>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="move" label={{ value: "Move", position: "insideBottom", offset: -5 }} />
                            <YAxis domain={[-2, 2]} label={{ value: "Evaluation", angle: -90, position: "insideLeft" }} />
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