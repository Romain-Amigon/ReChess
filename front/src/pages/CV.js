import React from "react";

const CV = () => {
    return (
        <div style={{ padding: "20px", textAlign: "center" }}>
            <h1>Mon CV</h1>
            <h2>Etudiant en informatique : IA, data analyse, imagerie<br />
                Je suis toujours en recherche de travail</h2>
            <p>Vous pouvez visualiser ou télécharger mon CV ci-dessous :</p>

            <embed
                src="/CV.pdf"   // ✅ placé dans public/
                type="application/pdf"
                width="80%"
                height="800px"
                style={{ border: "1px solid #ddd", borderRadius: "8px" }}
            />

            <div style={{ marginTop: "20px" }}>
                <a
                    href="/CV.pdf"  // ✅ idem
                    download
                    style={{
                        padding: "10px 20px",
                        background: "#007bff",
                        color: "#fff",
                        textDecoration: "none",
                        borderRadius: "5px",
                    }}
                >
                    Télécharger le CV
                </a>
            </div>
        </div>
    );
};

export default CV;
