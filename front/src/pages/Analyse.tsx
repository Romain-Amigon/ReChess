import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import '../styles/global.css';
import Echiquier from "../code/echiquier";
import Historique, { Coup } from "../code/Historique";
import Bar from "../code/EvaluationBar";
import EvaluationGraph from "../code/EvaluationGraph";

export function Analyse() {
    const [game, setGame] = useState(new Chess());
    const [pgnInput, setPgnInput] = useState("");
    const [moveHistory, setMoveHistory] = useState<Coup[]>([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [boardKey, setBoardKey] = useState(0);
    const [dernierCoup, setDernierCoup] = useState<Coup | null>(null);
    const [FenPartie, setFenPartie] = useState<string[]>([]);

    const [analysisResult, setAnalysisResult] = useState<React.JSX.Element | null>(null);

    function PGNtoFen(game: Chess) {
        const history = game.history({ verbose: true });
        const replay = new Chess();
        const fens: string[] = [];

        for (const move of history) {
            replay.move(move);
            fens.push(replay.fen());
        }

        setFenPartie(fens); // ✅ enregistre dans le state
    }


    function importPGN() {
        const newGame = new Chess();
        try {
            newGame.loadPgn(pgnInput);
            //console.log(newGame);
            PGNtoFen(newGame);
            const verboseMoves = newGame.history({ verbose: true });
            const coups: Coup[] = verboseMoves.map(m => ({
                from: m.from,
                to: m.to,
                piece: m.piece,

            } as Coup));
            //console.log(newGame);
            setGame(newGame);

            setMoveHistory(coups);
            setCurrentMoveIndex(coups.length);
            setBoardKey(prev => prev + 1);
        } catch (error) {
            alert("PGN invalide");
        }
    }


    function runAnalysis() {
        console.log('eeeee')
        const graph = <EvaluationGraph fens={FenPartie} />;
        setAnalysisResult(graph);
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
                ...prev.slice(0, currentMoveIndex),
                dernierCoup
            ]);
            setCurrentMoveIndex(prev => prev + 1);

            // ➕ stocker la nouvelle FEN
            const newGame = new Chess(game.fen());
            newGame.move({ from: dernierCoup.from, to: dernierCoup.to });
            setFenPartie(prev => [...prev, newGame.fen()]);

            //console.log("Nouveau coup :", dernierCoup, "FEN :", newGame.fen());
        }
    }, [dernierCoup]);

    return (
        <div className="chess-bg">
            <div className="chess-container" >
                <div style={{ flex: 1 }}>
                    <h1 className="chess-title">Import game</h1>
                    <textarea
                        rows={6}
                        placeholder="paste a PGN here..."
                        value={pgnInput}
                        onChange={e => setPgnInput(e.target.value)}
                        style={{ width: "95%", marginBottom: 12 }}
                    />
                    <button className="chess-btn" onClick={importPGN} style={{ marginBottom: 24 }}>Import PGN</button>
                    <div className="chessboard-wrapper" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                        {/* Ligne du FEN seule */}
                        <div style={{ marginBottom: 8 }}>FEN : {game.fen()}</div>

                        {/* Flex Echiquier + Bar */}
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 20 }}>
                            <Echiquier key={boardKey} position={game.fen()} onMove={setDernierCoup} />
                            <div style={{ flex: "0 0 200px" }}>
                                <Bar fen={game.fen()} depth={25} />
                            </div>
                        </div>

                        <div style={{ width: "100%" }}>
                            <EvaluationGraph fens={FenPartie} />;
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

