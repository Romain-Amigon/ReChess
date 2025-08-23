import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import '../styles/global.css';
import Echiquier from "./echiquier";
import Bar from "./EvaluationBar";
type FeuilleProps = {
    fen: string;
    Nscore: number;
    commentaire: string | null;
    childs: string[] | null;
};

const Feuille: React.FC<FeuilleProps> = ({ fen, Nscore, commentaire }) => {



    return (

        <div className="chess-bg">
            <div
                className="chess-container"
                style={{
                    display: "flex",
                    flexDirection: "row",   // ✅ tout en ligne
                    alignItems: "flex-start",
                    gap: 32
                }}
            >
                {/* Colonne 1 : Echiquier */}
                <div style={{ flex: "0 0 auto" }}>

                    <div className="chessboard-wrapper" style={{ marginTop: 8 }}>
                        <Echiquier position={fen} />
                    </div>
                </div>

                {/* Colonne 2 : Bar */}
                <div style={{ flex: "0 0 auto", marginTop: 60 }}>
                    <div style={{ marginTop: 20 }}>
                        {(
                            <div>
                                <p><strong>Score :</strong> {Nscore}</p>
                            </div>
                        )}

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
                                    height: `${Nscore}%`
                                }} />
                                <div style={{
                                    background: "black",
                                    borderBottomLeftRadius: '12px',
                                    borderBottomRightRadius: '12px',
                                    height: `${100 - Nscore}%`
                                }} />
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </div>

    );
}

export default Feuille;
export type { FeuilleProps };