import React, { useEffect, useState } from "react";
import Engine from "./engine";
import { Chess } from "chess.js";

interface EngineAnalysisProps {
    fen: string;
    depth?: number;
    engine: Engine; // ⚡ on réutilise toujours le même Engine (créé dans le parent avec useMemo)
}

const EngineAnalysis: React.FC<EngineAnalysisProps> = ({ fen, depth = 12, engine }) => {
    const [score, setScore] = useState<number | null>(null);
    const [bestMove, setBestMove] = useState<string | null>(null);
    const [mate, setMate] = useState<string | null>(null);

    useEffect(() => {
        if (!fen) return;

        let active = true;

        // ⚡ Stop l'ancienne recherche et lance la nouvelle
        engine.stop();
        engine.evaluatePosition(fen, depth);

        const handler = ({
            positionEvaluation,
            possibleMate,
            pv,
            depth: currentDepth,
        }: any) => {
            if (!active) return;
            if (currentDepth && currentDepth < Math.max(6, depth / 2)) return;

            const chess = new Chess(fen);

            // calcul du score en centipawns
            if (positionEvaluation) {
                const evalCp = Number(positionEvaluation);
                const adjusted = (chess.turn() === "w" ? 1 : -1) * evalCp / 100;
                setScore(Math.round(adjusted * 100) / 100);
            }

            // best move = premier coup de la PV
            if (pv) {
                setBestMove(pv.split(" ")[0]);
            }

            // mate si dispo
            if (possibleMate) {
                setMate(`#${possibleMate}`);
            }
        };

        engine.onMessage(handler);

        return () => {
            active = false;
            engine.stop();
        };
    }, [fen, depth, engine]);

    return (
        <div style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
            <h3>Analyse de position</h3>
            <p><strong>FEN :</strong> {fen}</p>
            <p><strong>Évaluation :</strong> {mate ? mate : score !== null ? score : "..."}</p>
            <p><strong>Meilleur coup :</strong> {bestMove || "..."}</p>
        </div>
    );
};

export default EngineAnalysis;
