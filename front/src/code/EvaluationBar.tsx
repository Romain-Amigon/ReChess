import React, { useState, useEffect } from "react";

type BarProps =
    | { fen: string; depth: number; score?: undefined }  // mode analyse
    | { score: number; fen?: undefined; depth?: undefined }; // mode score direct

const Bar: React.FC<BarProps> = (props) => {
    const [bestMove, setBestMove] = useState<string | null>(null);
    const [score, setScore] = useState<number | null>(
        "score" in props && props.score !== undefined ? props.score : null
    );
    const [mate, setMate] = useState<number | null>(null);

    const analyze = async (fen: string, depth: number) => {
        try {
            const res = await fetch("http://localhost:4000/analyse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fen, depth }),
            });
            const data = await res.json();
            setBestMove(data.bestmove);
            const trait = fen.split(" ")[1];

            if (data.mate !== null) {
                setMate(data.mate);
                setScore(trait === "w" ? 1000 : -1000);
            } else {
                setMate(null);
                setScore(trait === "b" ? -data.score : data.score);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // ⚡ Mode analyse uniquement si pas de score fourni
    useEffect(() => {
        if ("fen" in props && props.fen && props.depth) {
            analyze(props.fen, props.depth);
        }
    }, [props]);

    const normalizedScore = score !== null
        ? (mate !== null
            ? Math.max(0, Math.min(100, (score >= 0 ? score : 0) / 10))
            : Math.max(5, Math.min(95, ((score / 100) + 4) / 8 * 100)))
        : 50;

    return (
        <div style={{ marginTop: 20 }}>
            {bestMove && (
                <div>
                    <p><strong>Meilleur coup :</strong> {bestMove}</p>
                </div>
            )}
            <p><strong>Score :</strong> {score}</p>

            <div style={{
                display: "flex",
                height: 350,
                width: "100%",
                backgroundColor: "#eee",
                borderRadius: 4,
                overflow: "hidden",
                marginTop: 8
            }}>
                <div style={{
                    width: "40px",
                    borderRadius: '12px',
                    height: "300px",
                    border: "1px solid black",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    <div style={{
                        background: "white",
                        borderTopLeftRadius: '12px',
                        borderTopRightRadius: '12px',
                        height: `${normalizedScore}%`
                    }} />
                    <div style={{
                        background: "black",
                        borderBottomLeftRadius: '12px',
                        borderBottomRightRadius: '12px',
                        height: `${100 - normalizedScore}%`
                    }} />
                </div>
            </div>
        </div>
    );
};

export default Bar;
