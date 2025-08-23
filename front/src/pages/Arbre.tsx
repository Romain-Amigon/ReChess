import React, { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { useUser } from "../code/userContext";

type TreeNode = {
    fen: string;
    commentaire: string;
    childs: string[];
};

type TreeMap = Map<string, TreeNode>;

export default function Arbre() {
    const { user } = useUser();
    const [userTree, setUserTree] = useState<TreeMap>(new Map());

    useEffect(() => {
        if (user?.tree) {
            // On transforme les entrées en [string, TreeNode]
            const entries = Object.entries(user.tree).map(([key, value]) => [
                key,
                value as TreeNode, // cast explicite
            ]) as [string, TreeNode][];

            const treeMap = new Map<string, TreeNode>(entries);
            setUserTree(treeMap);
        }
    }, [user]);


    const addChild = (parentKey: string) => {
        const newKey = `node-${Date.now()}`;
        const parentNode = userTree.get(parentKey);
        if (!parentNode) return;

        const newNode: TreeNode = {
            fen: parentNode.fen, // même position que le parent par défaut
            commentaire: "",
            childs: [],
        };

        const updatedTree = new Map(userTree);
        updatedTree.set(newKey, newNode);

        parentNode.childs.push(newKey);
        updatedTree.set(parentKey, parentNode);

        setUserTree(updatedTree);
    };

    const chessboardOptions = (userTree: TreeNode) => ({
        position: userTree.fen,

    });

    const renderTree = (tree: TreeMap): React.JSX.Element[] => {


        return Array.from(tree.entries()).map(([key, value]) => (
            <div key={key} style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
                    <h3 style={{ margin: 0 }}>{key}</h3>
                    <div style={{ width: 200, height: 200 }}>
                        <Chessboard options={chessboardOptions(value)} />
                    </div>
                    <button
                        onClick={() => addChild(key)}
                        style={{ padding: "5px 10px", cursor: "pointer" }}
                    >
                        +
                    </button>
                </div>

                <div style={{ marginTop: "20px" }}>
                    {value.childs.map((childKey) => {
                        const child = tree.get(childKey);
                        return child ? (
                            <div key={childKey}>{renderTree(new Map([[childKey, child]]))}</div>
                        ) : null;
                    })}
                </div>
            </div >

        ));
    };

    return (
        <div>
            {user ? (
                <div>
                    <h2>Bienvenue {user.username} 👋</h2>
                    <p>{user.email}</p>
                    <div>
                        <h3>Votre arbre de parties :</h3>
                        {userTree.size > 0 ? renderTree(userTree) : <p>Aucun arbre trouvé.</p>}
                    </div>
                </div>
            ) : (
                <p>⚠️ Veuillez vous connecter pour voir l'arbre.</p>
            )}
        </div>
    );
}
