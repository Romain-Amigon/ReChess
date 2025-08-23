import React from "react";
import { Link } from "react-router-dom";
import '../styles/global.css';

export default function Home() {
    return (
        <div className="chess-bg">
            <div className="chess-container">
                <h1 className="chess-title">Bienvenue sur Chess Study</h1>
                <p>Analysez vos parties et créez vos études personnelles.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                    <Link className="chess-btn" to="/analyse">Aller à l'analyse</Link>
                    <Link className="chess-btn" to="/etudes">Voir les études</Link>
                    <Link className="chess-btn" to="/echiquier">Échiquier</Link>
                </div>
            </div>
        </div>
    );
}
