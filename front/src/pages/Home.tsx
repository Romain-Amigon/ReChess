import React from "react";
import { Link } from "react-router-dom";
import '../styles/global.css';

export default function Home() {
    return (
        <div className="chess-bg">
            <div className="chess-container">
                <h1 className="chess-title">ReChess</h1>
                <p>Analyze your games and create your personal studies.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                    <Link className="chess-btn" to="/analysis">Analysis game</Link>
                    <Link className="chess-btn" to="/tree">Search tree</Link>
                </div>
            </div>
        </div>
    );
}
