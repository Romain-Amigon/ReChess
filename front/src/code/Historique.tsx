import React, { useState } from "react";
import { Chess, PieceSymbol, Square } from "chess.js";
import { Chessboard, SquareHandlerArgs, PieceDropHandlerArgs, chessColumnToColumnIndex } from "react-chessboard";


export type Coup = {
    from: string;
    to: string;
    piece: string;
    notation: string;
};
type HistoriqueProps = {
    coups: Coup[];
};
function getPieceSymbol(piece: string) {
    //console.log("eee", piece);
    switch (piece.toLowerCase()) {
        case "p": return "♟"; // pion
        case "r": return "♜"; // tour
        case "n": return "♞"; // cavalier
        case "b": return "♝"; // fou
        case "q": return "♛"; // dame
        case "k": return "♚"; // roi
        default: return "?";
    }
}

const Historique: React.FC<HistoriqueProps> = ({ coups }) => {

    // Diviser les coups en paires [blanc, noir]
    const coupsPairs: { blanc: Coup; noir?: Coup }[] = [];
    for (let i = 0; i < coups.length; i += 2) {
        coupsPairs.push({
            blanc: coups[i],
            noir: coups[i + 1],
        });
    }

    return (
        <div>
            <h3 style={{ marginTop: 0, marginBottom: 12, textAlign: 'center' }}>Historique des coups</h3>
            <div style={{ display: "flex", justifyContent: "center" }}>

                <ol start={0} style={{ marginRight: 20 }}>
                    {coupsPairs.map((pair, idx) => (
                        <li key={idx}>{getPieceSymbol(pair.blanc.piece)} {pair.blanc.to}</li>
                    ))}
                </ol>


                <ul style={{ listStyleType: "none" }}>
                    {coupsPairs.map((pair, idx) => (
                        <li key={idx}>{pair.noir ? getPieceSymbol(pair.noir.piece) + " " + pair.noir.to : ""}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


export default Historique;

