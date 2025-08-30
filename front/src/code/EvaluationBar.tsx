import React, { useState, useEffect } from "react";

type BarProps =
    | { fen: string; depth: number; score?: undefined; width?: number; height?: number }  // mode analyse
    | { score: number; fen?: undefined; depth?: undefined; width?: number; height?: number }; // mode score direct

const Bar: React.FC<BarProps> = (props) => {
    //console.log("creation Bar", props);
    const [bestMove, setBestMove] = useState<string | null>(null);
    const [score, setScore] = useState<number | null>(
        "score" in props && props.score !== undefined ? props.score : null
    );
    const [mate, setMate] = useState<number | null>(null);
    const trait = props.fen ? props.fen.split(" ")[1] : "w"; // par défaut blanc
    const barWidth = props.width ?? 40;
    const barHeight = props.height ?? 300;

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
                //setScore(trait === "b" ? -data.score : data.score);
                setScore(data.score);
            }
        } catch (err) {
            console.error(err);
        }
    };


    useEffect(() => {
        if (props.fen && props.depth) {
            analyze(props.fen, props.depth);
        }
    }, [props.fen, props.depth]);

    const Nscore = score !== null
        ? (score) / 100
        : (mate !== null) ? mate : 0;

    const normalizedScore = score !== null
        ?
        Math.max(5, Math.min(95, (Nscore + 4) * 13))
        : (mate !== null) ? ((trait === "w") ? 100 : 0) : 50;

    //console.log(props.fen, score, Nscore, normalizedScore);
    return (
        <div style={{ marginTop: 20 }}>
            {bestMove && (
                <div>
                    <p><strong>Best move :</strong> {bestMove}</p>
                </div>
            )}
            <p><strong>Score :</strong> {mate ? "M" + mate : Nscore}</p>

            <div style={{
                display: "flex",
                height: barHeight + 20,
                width: "100%",
                borderRadius: 4,
                overflow: "hidden",
                marginTop: 8,
                justifyContent: "center"
            }}>
                <div style={{
                    width: `${barWidth}px`,
                    height: `${barHeight}px`,
                    borderRadius: '12px',
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

export default React.memo(Bar);
