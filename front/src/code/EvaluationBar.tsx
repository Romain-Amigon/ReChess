import React, { useState, useEffect, useRef } from "react";
import Engine from "./engine";

type BarProps =
    | { fen: string; depth: number; score?: undefined; width?: number; height?: number }
    | { score: number; fen?: undefined; depth?: undefined; width?: number; height?: number };

const Bar: React.FC<BarProps> = (props) => {
    const [bestMove, setBestMove] = useState<string | null>(null);
    const [score, setScore] = useState<number | null>(
        "score" in props && props.score !== undefined ? props.score : null
    );
    const [mate, setMate] = useState<number | null>(null);

    const trait = props.fen ? props.fen.split(" ")[1] : "w"; // par défaut blanc
    const barWidth = props.width ?? 40;
    const barHeight = props.height ?? 300;

    const engineRef = useRef<Engine | null>(null);

    const savePosition = async (fen: string, score: number, bestMove: string | null, depth: number, mate: number | null) => {
        //console.log("save", bestMove)
        try {
            await fetch("http://localhost:4000/analyse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fen, bestMove, score, mate, depth }),
            });
        } catch (err) {
            console.error("Erreur lors de l'enregistrement en BDD:", err);
        }
    };

    const latestData = useRef<{ score: number | null; bestMove: string | null; mate: number | null }>({
        score: null,
        bestMove: null,
        mate: null,
    });

    useEffect(() => {
        if ("fen" in props && props.fen && props.depth) {
            if (!engineRef.current) engineRef.current = new Engine();
            const engine = engineRef.current;

            const listener = ({ positionEvaluation, bestMove, possibleMate }: { positionEvaluation?: string; bestMove?: string; possibleMate?: string }) => {
                let newScore: number | null = null;
                let newMate: number | null = null;

                if (possibleMate) {
                    newMate = Number(possibleMate);
                    newScore = trait === "w" ? 1000 : -1000;
                } else if (positionEvaluation) {
                    const evalCp = Number(positionEvaluation);
                    newScore = trait === "w" ? evalCp : -evalCp;
                }

                // Update ref with latest values
                if (bestMove) latestData.current.bestMove = bestMove;
                if (newScore !== null) latestData.current.score = newScore;
                if (newMate !== null) latestData.current.mate = newMate;

                // Update state for UI
                if (bestMove) setBestMove(bestMove);
                if (newScore !== null) setScore(newScore);
                if (newMate !== null) setMate(newMate);
                console.log(props.fen!, latestData.current.score!, latestData.current.bestMove!, props.depth!, latestData.current.mate)
                // Save to DB when bestMove is received
                //if (bestMove && latestData.current.score !== null) {
                //    savePosition(props.fen!, latestData.current.score!, latestData.current.bestMove!, props.depth!, latestData.current.mate);
                //}
            };

            engine.onMessage(listener);
            engine.evaluatePosition(props.fen, props.depth);

            return () => {
                engine.stop();
            };
        }
    }, [props.fen, props.depth, trait]);

    const Nscore = score !== null ? score / 100 : mate !== null ? mate : 0;
    const normalizedScore =
        score !== null
            ? Math.max(5, Math.min(95, (Nscore + 4) * 13))
            : mate !== null
                ? trait === "w"
                    ? 100
                    : 0
                : 50;

    return (
        <div style={{ marginTop: 20 }}>
            {bestMove && (
                <div>
                    <p>
                        <strong>Best move :</strong> {bestMove}
                    </p>
                </div>
            )}
            <p>
                <strong>Score :</strong> {mate ? "M" + mate : Nscore}
            </p>
            <div
                style={{
                    display: "flex",
                    height: barHeight + 20,
                    width: "100%",
                    borderRadius: 4,
                    overflow: "hidden",
                    marginTop: 8,
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        width: `${barWidth}px`,
                        height: `${barHeight}px`,
                        borderRadius: "12px",
                        border: "1px solid black",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div
                        style={{
                            background: "white",
                            borderTopLeftRadius: "12px",
                            borderTopRightRadius: "12px",
                            height: `${normalizedScore}%`,
                        }}
                    />
                    <div
                        style={{
                            background: "black",
                            borderBottomLeftRadius: "12px",
                            borderBottomRightRadius: "12px",
                            height: `${100 - normalizedScore}%`,
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default React.memo(Bar);
