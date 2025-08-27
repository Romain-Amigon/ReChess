import React, { useState, useEffect, useRef } from "react";
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

type TreeNodeProps = {
    nodeKey: number;
    node: TreeNode;
    tree: TreeMap;
    openModal: (parentKey: number, parentFen: string) => void;
    updateComment?: (nodeKey: number, newComment: string) => void;
    ischild: boolean;
    registerRect?: (rect: DOMRect) => void; // 👈 callback vers le parent
};

function CurveLine({ from, to }: { from: DOMRect; to: DOMRect }) {
    const x1 = from.right; // côté droit du parent
    const y1 = from.top + from.height / 2;
    const x2 = to.left; // côté gauche de l’enfant
    const y2 = to.top + to.height / 2;
    console.log("Drawing line from", { x1, y1 }, "to", { to, x2, y2 });
    const midX = (x1 + x2) / 2;
    const pathData = `M ${x1},${y1} C ${midX},${y1} ${midX},${y2} ${x2},${y2}`;

    return <path d={pathData} stroke="black" strokeWidth={2} fill="none" />;
}

function TreeNodeComponent({
    nodeKey,
    node,
    tree,
    openModal,
    updateComment,
    ischild,
    registerRect,
}: TreeNodeProps) {
    const [pos, setPos] = useState<Position | null>(null);
    const [comment, setComment] = useState(node.commentaire);

    const nodeRef = useRef<HTMLDivElement>(null);
    const [childRects, setChildRects] = useState<DOMRect[]>([]);
    const [parentRect, setParentRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (nodeRef.current) {
            const rect = nodeRef.current.getBoundingClientRect();
            setParentRect(rect);
            // informer le parent si besoin
            if (registerRect) registerRect(rect);
        }
    }, [nodeRef.current]);

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
        <div style={{ marginBottom: "20px", display: "flex", flexDirection: "row", alignItems: "center" }}>
            {/* Bloc du noeud */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                    ref={nodeRef}
                    style={{
                        display: "flex", flexDirection: "row", alignItems: "center", gap: "10px",
                    }}
                >
                    <h3 style={{ margin: 0 }}>{nodeKey}</h3>

                    <div style={{ width: 200, height: 200, marginLeft: 10 }}>
                        <Chessboard options={{ position: node.fen }} />
                    </div>

                    <div
                        style={{
                            width: 80,
                            height: 200,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: 10,
                        }}
                    >
                        {pos ? (
                            <Bar score={pos.score} width={40} height={150} />
                        ) : (
                            <p>⏳...</p>
                        )}
                    </div>

                    <button
                        onClick={() => openModal(nodeKey, node.fen)}
                        style={{ padding: "5px 10px", cursor: "pointer", marginLeft: 10 }}
                    >
                        +
                    </button>
                </div>

                <div style={{ marginBottom: "10px" }}>
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
            </div>
            {/* Rendu des enfants */}
            {
                !ischild && (
                    <div
                        style={{
                            display: "flex", flexDirection: "column", alignItems: "center", marginLeft: "100px",
                        }}
                    >
                        {node.childs.map((childKey) => {
                            const child = tree.get(childKey);
                            return child ? (
                                <TreeNodeComponent
                                    key={childKey}
                                    nodeKey={childKey}
                                    node={child}
                                    tree={tree}
                                    openModal={openModal}
                                    updateComment={updateComment}
                                    ischild={true}
                                    registerRect={(rect) =>
                                        setChildRects((prev) => [...prev, rect])
                                    }
                                />
                            ) : null;
                        })}
                    </div>
                )
            }

            {/* SVG pour les lignes */}
            {
                parentRect && childRects.length > 0 && (
                    <svg
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "20000%",
                            zIndex: 0,
                            pointerEvents: "none",
                        }}
                    >
                        {childRects.map((rect, idx) => (
                            <CurveLine key={idx} from={parentRect} to={rect} />
                        ))}
                    </svg>
                )
            }
        </div >
    );
}

export default function Arbre() {
    const { user, updateUser } = useUser();
    const [userTree, setUserTree] = useState<TreeMap>(new Map());
    const [modalOpen, setModalOpen] = useState(false);
    const [modalParent, setModalParent] = useState<number | null>(null);
    const [chess, setChess] = useState<any>(new Chess());
    const [fen, setFen] = useState("start");
    const [currentNodeKey, setCurrentNodeKey] = useState<number>(0);

    useEffect(() => {
        if (user?.tree) {
            const entries: [number, TreeNode][] = Object.entries(user.tree).map(
                ([key, value]) => [Number(key), value as TreeNode]
            );
            setUserTree(new Map(entries));
        }
    }, [user]);

    // Fonction pour synchroniser l'arbre avec le serveur
    const syncTreeWithServer = async (updatedTree: TreeMap) => {
        if (!user) return;

        try {
            const response = await fetch(`http://localhost:4000/users/${user.username}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tree: Object.fromEntries(updatedTree) }), // Convertir Map en objet
            });

            if (!response.ok) {
                throw new Error("Erreur lors de la mise à jour de l'arbre sur le serveur");
            }

            const updatedUser = await response.json();
            // Mettre à jour l'utilisateur dans le contexte
            updateUser(updatedUser); // Assurez-vous que setUser est accessible (voir Étape 3)
            localStorage.setItem("user", JSON.stringify(updatedUser));
            console.log("Arbre synchronisé avec le serveur :", updatedTree);
        } catch (error) {
            console.error("Erreur lors de la synchronisation de l'arbre :", error);
        }
    };

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
        if (!targetSquare) return false;

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

    const validateMove = async () => {
        if (modalParent == null) return;

        const newKey = Math.max(...Array.from(userTree.keys())) + 1;
        const parentNode = userTree.get(modalParent);
        if (!parentNode) return;

        const newNode: TreeNode = {
            fen: fen,
            commentaire: "",
            childs: [],
        };

        try {
            const res = await fetch(`http://localhost:4000/positions/${encodeURIComponent(fen)}`);
            if (!res.ok) {
                await fetch("http://localhost:4000/analyse", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fen, depth: 15 }),
                });
                console.log("Position analysée et insérée :", fen);
            } else {
                console.log("Position déjà présente dans la BDD :", fen);
            }
        } catch (e) {
            console.error("Erreur lors de la vérification ou analyse de la position :", e);
            return;
        }

        const updatedTree = new Map(userTree);
        updatedTree.set(newKey, newNode);
        parentNode.childs.push(newKey);
        updatedTree.set(modalParent, parentNode);
        setUserTree(updatedTree);

        // Synchroniser l'arbre avec le serveur
        await syncTreeWithServer(updatedTree);

        closeModal();
    };

    const updateComment = (nodeKey: number, newComment: string) => {
        const updatedTree = new Map(userTree);
        const node = updatedTree.get(nodeKey);
        if (node) {
            node.commentaire = newComment;
            updatedTree.set(nodeKey, node);
            setUserTree(updatedTree);

            // Synchroniser l'arbre avec le serveur
            syncTreeWithServer(updatedTree);
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

                            <TreeNodeComponent
                                key={currentNodeKey}
                                nodeKey={currentNodeKey}
                                node={userTree.get(currentNodeKey)!}
                                tree={userTree}
                                openModal={openModal}
                                updateComment={updateComment}
                                ischild={false}
                            />

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
