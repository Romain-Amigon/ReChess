import React, { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { useUser } from "../code/userContext";
import Bar from "../code/EvaluationBar";
import { Chess } from "chess.js";
import type { PieceDropHandlerArgs } from "react-chessboard";
import Echiquier from "../code/echiquier";
import Engine from "../code/engine";

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
    depth: number;
};

type TreeNodeProps = {
    nodeKey: number;
    node: TreeNode;
    tree: TreeMap;
    openModal: (parentKey: number, parentFen: string) => void;
    deleteNode: (nodeKey: number) => void;
    updateComment?: (nodeKey: number, newComment: string) => void;
    ischild: boolean;
    isparent: boolean;
    registerRect?: (rect: DOMRect) => void;
    onSelectNode: (nodeKey: number) => void; // 👈 nouvelle prop
};

function CurveLine({ from, to }: { from: DOMRect; to: DOMRect }) {
    const x1 = from.right;
    const y1 = from.top + from.height / 2;
    const x2 = to.left;
    const y2 = to.top + to.height / 2;
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
    deleteNode,
    ischild,
    isparent,
    registerRect,
    onSelectNode,
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
        <div
            style={{
                marginBottom: "20px",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {/* Bloc du noeud */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                    ref={nodeRef}
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "10px",
                        border: "2px solid transparent",
                        padding: "5px",
                        borderRadius: "5px",
                        cursor: "pointer",
                    }}
                    onClick={() => ischild && onSelectNode(nodeKey)} // 👈 sélection du noeud
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
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // pour ne pas sélectionner en même temps
                                    openModal(nodeKey, node.fen);
                                }}
                                style={{ padding: "5px 10px", cursor: "pointer", marginLeft: 10 }}
                            >
                                +
                            </button>
                        </div>
                        {ischild && (!isparent) && <div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNode(nodeKey);
                                }}
                                style={{ padding: "5px 10px", cursor: "pointer", marginLeft: 10 }}
                            >
                                x
                            </button>
                        </div>}
                    </div>
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

            {/* Enfants */}
            {!ischild && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        marginLeft: "100px",
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
                                deleteNode={deleteNode}
                                updateComment={updateComment}
                                ischild={true}
                                isparent={false}
                                onSelectNode={onSelectNode}
                                registerRect={(rect) =>
                                    setChildRects((prev) => [...prev, rect])
                                }
                            />
                        ) : null;
                    })}
                </div>
            )}

            {/* Lignes */}
            {parentRect && childRects.length > 0 && (
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
            )}
        </div>
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
    const [parents, setParents] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (user?.tree) {
            const entries: [number, TreeNode][] = Object.entries(user.tree).map(
                ([key, value]) => [Number(key), value as TreeNode]
            );
            setUserTree(new Map(entries));
        }
    }, [user]);

    const handleSelectNode = (nodeKey: number) => {
        setParents([...parents, currentNodeKey]); // on empile le parent
        //console.log(parents)
        setCurrentNodeKey(nodeKey);
    };

    const goBack = () => {
        if (parents.length === 0) return;
        const newParents = [...parents];
        const lastParent = newParents.pop()!;
        setParents(newParents);
        setCurrentNodeKey(lastParent);
    };

    const syncTreeWithServer = async (updatedTree: TreeMap) => {
        if (!user) return;
        try {
            const response = await fetch(`http://localhost:4000/users/${user.username}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tree: Object.fromEntries(updatedTree) }),
            });
            if (!response.ok) throw new Error("Erreur MAJ serveur");
            const updatedUser = await response.json();
            updateUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (error) {
            console.error("Erreur sync arbre :", error);
        }
    };

    const deleteNode = (nodeKey: number) => {
        if (!userTree.has(nodeKey)) return;
        const updatedTree = new Map(userTree);

        updatedTree.forEach((node, key) => {
            if (node.childs.includes(nodeKey)) {
                node.childs = node.childs.filter((child) => child !== nodeKey);
                updatedTree.set(key, node);
            }
        });

        const deleteRecursively = (key: number) => {
            const target = updatedTree.get(key);
            if (!target) return;
            for (const child of target.childs) deleteRecursively(child);
            updatedTree.delete(key);
        };
        deleteRecursively(nodeKey);

        setUserTree(updatedTree);
        syncTreeWithServer(updatedTree);
    };

    const openModal = (parentKey: number, parentFen: string) => {
        const game = new Chess(parentFen);
        setChess(game);
        setFen(parentFen);
        setModalParent(parentKey);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalParent(null);
    };

    const handleDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
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

    const engineRef = useRef<Engine | null>(null);

    const savePosition = async (fen: string, score: number, bestMove: string | null, depth: number, mate: number | null) => {
        console.log("save", bestMove)
        try {
            await fetch("http://localhost:4000/analyse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fen, bestMove, score, mate, depth }),
            });
        } catch (err) {
            console.error("Erreur lors de l'enregistrement en BDD:", err);
        }
    };

    const latestData = useRef<{ score: number | null; bestMove: string | null; mate: number | null }>({
        score: null,
        bestMove: null,
        mate: null,
    });

    async function analyze(fen: string, depth: number): Promise<Position> {
        const position: Position = { fen, score: 0, mate: null, bestmove: null, depth };
        if (!engineRef.current) engineRef.current = new Engine();
        const engine = engineRef.current;

        const trait = fen.split(" ")[1];

        return new Promise((resolve, reject) => {
            // Timeout pour éviter que la promesse reste bloquée indéfiniment
            const timeout = setTimeout(() => {
                engine.stop();
                reject(new Error("Timeout: l'engine n'a pas répondu dans les 30 secondes"));
            }, 60000); // 15secondes max

            const listener = ({ positionEvaluation, bestMove, possibleMate }: {
                positionEvaluation?: string;
                bestMove?: string;
                possibleMate?: string
            }) => {
                if (positionEvaluation) {
                    const evalCp = Number(positionEvaluation);
                    position.score = trait === "w" ? evalCp : -evalCp;
                }

                if (possibleMate) {
                    position.mate = Number(possibleMate);
                    position.score = trait === "w" ? 1000 : -1000;
                }

                // ⚡️ n'enregistre PAS encore, juste garde les données
                if (bestMove) {
                    position.bestmove = bestMove;

                    // 👉 ici seulement on résout
                    clearTimeout(timeout);
                    engine.stop();
                    resolve(position);
                }
            };


            engine.onMessage(listener);
            engine.evaluatePosition(fen, depth);
        });
    }

    const validateMove = async () => {
        if (modalParent == null || loading) return;
        setLoading(true);

        const newKey = Math.max(...Array.from(userTree.keys())) + 1;
        const parentNode = userTree.get(modalParent);
        if (!parentNode) {
            setLoading(false);
            return;
        }


        const newNode: TreeNode = { fen, commentaire: "", childs: [] };

        try {
            const res = await fetch(`http://localhost:4000/positions/${encodeURIComponent(fen)}`);
            if (!res.ok) {
                console.log("n'existe pas");

                const position = await analyze(fen, 40);
                await savePosition(fen, position.score, position.bestmove, position.depth, position.mate);
            }
        } catch (e) {
            console.error("Erreur analyse :", e);
            setLoading(false);
            return;
        }




        const updatedTree = new Map(userTree);
        updatedTree.set(newKey, newNode);
        parentNode.childs.push(newKey);
        updatedTree.set(modalParent, parentNode);
        setUserTree(updatedTree);
        await syncTreeWithServer(updatedTree);

        setLoading(false);
        closeModal();
    };


    const updateComment = (nodeKey: number, newComment: string) => {
        const updatedTree = new Map(userTree);
        const node = updatedTree.get(nodeKey);
        if (node) {
            node.commentaire = newComment;
            updatedTree.set(nodeKey, node);
            setUserTree(updatedTree);
            syncTreeWithServer(updatedTree);
        }
    };

    const exportTree = () => {
        if (!userTree) return;
        const dataStr = JSON.stringify(Object.fromEntries(userTree), null, 2); // joliment formaté
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "chess_tree.json";
        a.click();
        URL.revokeObjectURL(url);
    };



    const importTree = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string) as Record<number, TreeNode>;

                // 1️⃣ Calculer la clé de départ pour le nouvel arbre
                const existingKeys = Array.from(userTree.keys());
                const maxKey = existingKeys.length > 0 ? Math.max(...existingKeys) : 0;
                let keyOffset = maxKey + 1;

                const oldToNewKeyMap = new Map<number, number>();

                Object.entries(json).map(([key, node]) => {
                    const oldKey = Number(key);
                    const newKey = keyOffset++;
                    oldToNewKeyMap.set(oldKey, newKey);
                });

                // 2️⃣ Créer le nouvel arbre avec clés décalées
                const newTreeEntries: [number, TreeNode][] = Object.entries(json).map(([key, node]) => {

                    // mettre à jour les enfants avec les nouvelles clés
                    const newChilds = node.childs.map((childKey) => oldToNewKeyMap.get(childKey) || childKey);
                    const newKey = oldToNewKeyMap.get(Number(key));
                    if (newKey === undefined) throw new Error("Clé introuvable dans oldToNewKeyMap");
                    return [newKey, { fen: node.fen, commentaire: node.commentaire, childs: newChilds } as TreeNode];
                });

                const newTree = new Map(userTree); // on clone l'arbre existant
                newTreeEntries.forEach(([key, node]) => newTree.set(key, node));

                // 3️⃣ Fusionner la racine : ajouter les enfants importés à la racine existante (clé 0)
                const importedRootKey = oldToNewKeyMap.get(0); // racine de l'import
                if (importedRootKey !== undefined && newTree.has(0)) {
                    const rootNode = newTree.get(0)!;
                    rootNode.childs.push(...newTree.get(importedRootKey)!.childs);
                    newTree.set(0, rootNode);
                }

                setUserTree(newTree);
                syncTreeWithServer(newTree);
            } catch (err) {
                alert("Error import !");
                console.error(err);
            }
        };

        reader.readAsText(file);
    };


    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click(); // ouvre la boîte de dialogue
    };

    return (
        <div>
            {user ? (
                <div>
                    <h2>Welcome {user.username} 👋</h2>
                    <div style={{ marginBottom: 20, gap: 30 }}>
                        <button onClick={exportTree}>Export tree</button>
                        <button onClick={handleImportClick}>Import tree</button>
                        {/* input caché */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={importTree}
                            style={{ display: "none" }}
                        />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>

                        {parents.length > 0 && <div style={{ marginBottom: 10 }}>
                            <TreeNodeComponent
                                key={parents[parents.length - 1]}
                                nodeKey={parents[parents.length - 1]}
                                node={userTree.get(parents[parents.length - 1])!}
                                tree={userTree}
                                openModal={openModal}
                                deleteNode={deleteNode}
                                updateComment={updateComment}
                                ischild={true}
                                isparent={true}
                                onSelectNode={goBack} // 👈 ajout
                            />
                        </div>}
                        {userTree.size > 0 ? (
                            <TreeNodeComponent
                                key={currentNodeKey}
                                nodeKey={currentNodeKey}
                                node={userTree.get(currentNodeKey)!}
                                tree={userTree}
                                openModal={openModal}
                                deleteNode={deleteNode}
                                updateComment={updateComment}
                                ischild={false}
                                isparent={false}
                                onSelectNode={handleSelectNode} // 👈 ajout
                            />
                        ) : (
                            <p>
                                No trees found.</p>
                        )}
                    </div>
                </div>
            ) : (
                <p>Please log in to view the tree.</p>
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
                        <div style={{ width: 400, height: 400 }}>
                            <Echiquier
                                position={fen}
                                onMove={(coup) => {
                                    const gameCopy = new Chess(fen);
                                    gameCopy.move({ from: coup.from, to: coup.to, promotion: "q" });
                                    setFen(gameCopy.fen());
                                }}
                                BoardSize={350}
                            />
                        </div>
                        <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                            <button onClick={validateMove} disabled={loading}>
                                {loading ? "Analysis..." : "Validate"}
                            </button>

                            <button onClick={closeModal}>Annuler</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
