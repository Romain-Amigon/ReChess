import React, { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { useUser } from "../code/userContext";
import Bar from "../code/EvaluationBar";
import { Chess } from "chess.js";
import type { PieceDropHandlerArgs } from "react-chessboard";
import Echiquier from "../code/echiquier";

type TreeNode = {
    fen: string;
    commentaire: string;
    childs: number[];
};

type TreeMap = Map<number, TreeNode>;

type Position = {
    fen: string;
    score: number;
    mate: number | null;
    bestmove: string | null;
    playCount: number;
    depth: number;
};

function TreeNodeComponent({
    nodeKey,
    node,
    tree,
    openModal,  // 👈 on ajoute la prop ici
    updateComment,
}: {
    nodeKey: number;
    node: TreeNode;
    tree: TreeMap;
    openModal: (parentKey: number, parentFen: string) => void;
    updateComment?: (nodeKey: number, newComment: string) => void;
}) {
    const [pos, setPos] = useState<Position | null>(null);
    const [comment, setComment] = useState(node.commentaire);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(
                    `http://localhost:4000/positions/${encodeURIComponent(node.fen)}`
                );
                if (res.ok) {
                    const data: Position = await res.json();
                    setPos(data);
                }
            } catch (e) {
                console.error("Erreur récupération position :", e);
            }
        })();
    }, [node.fen]);

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newComment = e.target.value;
        setComment(newComment);
        if (updateComment) {
            updateComment(nodeKey, newComment);
        }
    };

    return (
        <div key={nodeKey} style={{ marginBottom: "20px" }}>
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "10px",
                }}
            >
                <h3 style={{ margin: 0 }}>{nodeKey}</h3>

                <div style={{ width: 200, height: 200 }}>
                    <Chessboard options={{ position: node.fen }} />
                </div>

                <div
                    style={{
                        width: 80,
                        height: 200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {pos ? (
                        <Bar score={pos.score} width={40} height={150} />
                    ) : (
                        <p>⏳...</p>
                    )}
                </div>

                <button
                    onClick={() => openModal(nodeKey, node.fen)} // 👈 fix ici
                    style={{ padding: "5px 10px", cursor: "pointer" }}
                >
                    +
                </button>
            </div>
            <div style={{ marginTop: "10px" }}>
                <textarea
                    value={comment}
                    onChange={handleCommentChange}
                    placeholder="Ajouter un commentaire..."
                    style={{
                        width: "100%",
                        maxWidth: "480px",
                        minHeight: "60px",
                        padding: "5px",
                    }}
                />
            </div>

            <div style={{ marginTop: "20px" }}>
                {node.childs.map((childKey) => {
                    const child = tree.get(childKey);
                    return child ? (
                        <TreeNodeComponent
                            key={childKey}
                            nodeKey={childKey}
                            node={child}
                            tree={tree}
                            openModal={openModal} // 👈 on redescend la prop
                            updateComment={updateComment}
                        />
                    ) : null;
                })}
            </div>
        </div>
    );
}

export default function Arbre() {
    const { user } = useUser();
    const [userTree, setUserTree] = useState<TreeMap>(new Map());
    const [modalOpen, setModalOpen] = useState(false);
    const [modalParent, setModalParent] = useState<number | null>(null);
    const [chess, setChess] = useState<any>(new Chess());
    const [fen, setFen] = useState("start");

    useEffect(() => {
        if (user?.tree) {
            const entries: [number, TreeNode][] = Object.entries(user.tree).map(
                ([key, value]) => [Number(key), value as TreeNode]
            );
            setUserTree(new Map(entries));
        }
    }, [user]);


    const openModal = (parentKey: number, parentFen: string) => {
        const game = new Chess(parentFen);
        setChess(game);
        setFen(parentFen);
        setModalParent(parentKey);
        console.log("Ouverture modal pour parent :", parentKey);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalParent(null);
    };


    const handleDrop = ({ sourceSquare, targetSquare, piece }: PieceDropHandlerArgs): boolean => {
        if (!targetSquare) return false; // si on lâche hors de l’échiquier

        const gameCopy = new Chess(chess.fen());
        const move = gameCopy.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: "q",
        });

        if (move) {
            setChess(gameCopy);
            setFen(gameCopy.fen());
            return true;
        }

        return false;
    };




    const validateMove = () => {
        if (modalParent == null) return;

        const newKey = Math.max(...Array.from(userTree.keys())) + 1;
        const parentNode = userTree.get(modalParent);
        if (!parentNode) return;

        const newNode: TreeNode = {
            fen: fen, // utiliser la FEN actuelle de la modal
            commentaire: "",
            childs: [],
        };

        const updatedTree = new Map(userTree);
        updatedTree.set(newKey, newNode);
        parentNode.childs.push(newKey);
        updatedTree.set(modalParent, parentNode);
        setUserTree(updatedTree);


        const analyze = async (fen: string, depth: number) => {
            try {
                const res = await fetch("http://localhost:4000/analyse", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fen, depth }),
                });
                const data = await res.json();

            } catch (err) {
                console.error(err);
            }
        };
        // Vérifier si FEN existe dans la BDD, sinon créer la position pour la barre
        (async () => {
            try {
                const res = await fetch(`http://localhost:4000/positions/${encodeURIComponent(fen)}`);
                if (!res.ok) {
                    await fetch(`http://localhost:4000/positions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fen: fen,
                            score: 0,
                            mate: null,
                            bestmove: null,
                            playCount: 0,
                            depth: 0
                        }),
                    });
                    console.log("Position créée dans la BDD :", fen);
                }
            } catch (e) {
                console.error("Erreur lors de la création de la position :", e);
            }
        })();

        closeModal();
    };


    const updateComment = (nodeKey: number, newComment: string) => {
        const updatedTree = new Map(userTree);
        const node = updatedTree.get(nodeKey);
        if (node) {
            node.commentaire = newComment;
            updatedTree.set(nodeKey, node);
            setUserTree(updatedTree);
        }
    };

    return (
        <div>
            {user ? (
                <div>
                    <h2>Bienvenue {user.username} 👋</h2>
                    <p>{user.email}</p>
                    <div>
                        <h3>Votre arbre de parties :</h3>
                        {userTree.size > 0 ? (
                            Array.from(userTree.entries()).map(([key, node]) =>
                                key === 0 ? (
                                    <TreeNodeComponent
                                        key={key}
                                        nodeKey={key}
                                        node={node}
                                        tree={userTree}
                                        openModal={openModal}
                                        updateComment={updateComment}
                                    />
                                ) : null
                            )
                        ) : (
                            <p>Aucun arbre trouvé.</p>
                        )}
                    </div>
                </div>
            ) : (
                <p>⚠️ Veuillez vous connecter pour voir l'arbre.</p>
            )}

            {modalOpen && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            padding: "20px",
                            borderRadius: "8px",
                        }}
                    >
                        <h3>Nouvelle variante</h3>
                        <div style={{ width: 400, height: 400 }}>
                            <Echiquier
                                position={fen}
                                onMove={(coup) => {
                                    // mettre à jour le jeu temporaire dans la modal
                                    const gameCopy = new Chess(fen);
                                    gameCopy.move({ from: coup.from, to: coup.to, promotion: "q" });
                                    setFen(gameCopy.fen());
                                }}
                            />

                            {/* <Chessboard
                            <Chessboard
                                options={{
                                    position: fen,
                                    onPieceDrop: handleDrop, // 👈 ici dans options
                                }}
                            />*/}

                        </div>
                        <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                            <button onClick={validateMove}>Valider</button>
                            <button onClick={closeModal}>Annuler</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
