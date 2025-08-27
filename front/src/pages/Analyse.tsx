import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import '../styles/global.css';
import Echiquier from "../code/echiquier";
import Historique, { Coup } from "../code/Historique";
import Bar from "../code/EvaluationBar";


export function Analyse() {
    const [game, setGame] = useState(new Chess());
    const [pgnInput, setPgnInput] = useState("");
    const [moveHistory, setMoveHistory] = useState<Coup[]>([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [boardKey, setBoardKey] = useState(0);
    const [dernierCoup, setDernierCoup] = useState<Coup | null>(null);

    function importPGN() {
        const newGame = new Chess();
        try {
            newGame.loadPgn(pgnInput);
            console.log(newGame);
            const verboseMoves = newGame.history({ verbose: true });
            const coups: Coup[] = verboseMoves.map(m => ({
                from: m.from,
                to: m.to,
                piece: m.piece,

            } as Coup));
            console.log(newGame);
            setGame(newGame);

            setMoveHistory(coups);
            setCurrentMoveIndex(coups.length); // fin de partie par défaut
            setBoardKey(prev => prev + 1);
        } catch (error) {
            alert("PGN invalide");
        }
    }

    // Gérer navigation clavier
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "ArrowLeft") {
                setCurrentMoveIndex(i => Math.max(0, i - 1));
            } else if (e.key === "ArrowRight") {
                setCurrentMoveIndex(i => Math.min(moveHistory.length, i + 1));
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [moveHistory]);

    // Mettre à jour l’échiquier quand l’index change
    useEffect(() => {
        const replayGame = new Chess();
        for (let i = 0; i < currentMoveIndex; i++) {
            const move = moveHistory[i];
            replayGame.move({ from: move.from, to: move.to });
        }
        setGame(replayGame);
        setBoardKey(prev => prev + 1);
    }, [currentMoveIndex, moveHistory]);

    useEffect(() => {
        if (dernierCoup) {
            setMoveHistory(prev => [
                ...prev.slice(0, currentMoveIndex), // conserver l’historique jusqu’à l’index actuel
                dernierCoup
            ]);
            setCurrentMoveIndex(prev => prev + 1); // avancer l’index
            console.log("aaa", dernierCoup);
        }
    }, [dernierCoup]);
    return (
        <div className="chess-bg">
            <div className="chess-container" style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                    <h1 className="chess-title">Analyse/Import de partie</h1>
                    <textarea
                        rows={6}
                        placeholder="Colle un PGN ici..."
                        value={pgnInput}
                        onChange={e => setPgnInput(e.target.value)}
                        style={{ width: "100%", marginBottom: 12 }}
                    />
                    <button className="chess-btn" onClick={importPGN} style={{ marginBottom: 24 }}>Importer le PGN</button>
                    <div className="chessboard-wrapper" style={{ marginTop: 8 }}>
                        {/* Ligne du FEN seule */}
                        <div style={{ marginBottom: 8 }}>FEN : {game.fen()}</div>

                        {/* Flex Echiquier + Bar */}
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 20 }}>
                            <Echiquier key={boardKey} position={game.fen()} onMove={setDernierCoup} />
                            <div style={{ flex: "0 0 200px" }}>
                                <Bar fen={game.fen()} depth={15} />
                            </div>
                        </div>
                    </div>


                </div>

            </div>


            <div className="historique">
                <Historique coups={moveHistory} />
            </div>
        </div>
    );
}

export default Analyse;

