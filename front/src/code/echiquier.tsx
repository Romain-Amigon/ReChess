import React, { useRef, useState, useEffect } from "react";
import { Chess, PieceSymbol, Square } from "chess.js";
import { Chessboard, SquareHandlerArgs, PieceDropHandlerArgs, chessColumnToColumnIndex } from "react-chessboard";
import '../styles/global.css';
import { Coup } from "./Historique";

const PROMOTION_PIECES: PieceSymbol[] = ["q", "r", "b", "n"];

type EchiquierProps = {
    position?: string;
    onMove?: (coup: Coup) => void;
};


const Echiquier: React.FC<EchiquierProps> = ({ position, onMove }) => {
    // console.log("Echiquier position:", position);
    // create a chess game using a ref to always have access to the latest game state within closures and maintain the game state across renders
    const chessGameRef = useRef(new Chess(position));
    const chessGame = chessGameRef.current;

    // track the current position of the chess game in state to trigger a re-render of the chessboard
    const [chessPosition, setChessPosition] = useState(position || chessGame.fen());
    const [moveFrom, setMoveFrom] = useState('');
    const [optionSquares, setOptionSquares] = useState({});
    const calcBoardSize = () => Math.floor(window.innerWidth * 0.3);
    const [boardSize, setBoardSize] = useState(calcBoardSize);

    const [promotionMove, setPromotionMove] = useState<Omit<PieceDropHandlerArgs, 'piece'> | null>(null);
    const [coup, setCoup] = useState<Coup>();


    function handleMove(coup: Coup) {
        setCoup(coup); // ton état interne si besoin
        // peut-être update le parent ici
        //console.log("handleMove", coup);
        if (onMove) onMove(coup);
    }


    useEffect(() => {
        const handleResize = () => {
            setBoardSize(calcBoardSize());
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);



    // get the move options for a square to show valid moves
    function getMoveOptions(square: Square) {
        // get the moves for the square
        const moves = chessGame.moves({
            square,
            verbose: true
        });

        // if no moves, clear the option squares
        if (moves.length === 0) {
            setOptionSquares({});
            return false;
        }

        // create a new object to store the option squares
        const newSquares: Record<string, React.CSSProperties> = {};

        // loop through the moves and set the option squares
        for (const move of moves) {
            newSquares[move.to] = {
                background: chessGame.get(move.to) && chessGame.get(move.to)?.color !== chessGame.get(square)?.color ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)' // larger circle for capturing
                    : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
                // smaller circle for moving
                borderRadius: '50%'
            };
        }

        // set the square clicked to move from to yellow
        newSquares[square] = {
            background: 'rgba(255, 255, 0, 0.4)'
        };

        // set the option squares
        setOptionSquares(newSquares);

        // return true to indicate that there are move options
        return true;
    }
    function onSquareClick({
        square,
        piece
    }: SquareHandlerArgs) {
        // piece clicked to move
        if (!moveFrom && piece) {
            // get the move options for the square
            const hasMoveOptions = getMoveOptions(square as Square);

            // if move options, set the moveFrom to the square
            if (hasMoveOptions) {
                setMoveFrom(square);
            }

            // return early
            return;
        }

        // square clicked to move to, check if valid move
        const moves = chessGame.moves({
            square: moveFrom as Square,
            verbose: true
        });
        const foundMove = moves.find(m => m.from === moveFrom && m.to === square);

        // not a valid move
        if (!foundMove) {
            // check if clicked on new piece
            const hasMoveOptions = getMoveOptions(square as Square);

            // if new piece, setMoveFrom, otherwise clear moveFrom
            setMoveFrom(hasMoveOptions ? square : '');

            // return early
            return;
        }




        const movingPiece = chessGame.get(moveFrom as Square);
        const isWhitePromotion = movingPiece?.type === 'p' && movingPiece?.color === 'w' && square[1] === '8';
        const isBlackPromotion = movingPiece?.type === 'p' && movingPiece?.color === 'b' && square[1] === '1';

        if (isWhitePromotion || isBlackPromotion) {
            setPromotionMove({ sourceSquare: moveFrom, targetSquare: square });
            return true;
        }
        // is normal move
        try {
            chessGame.move({
                from: moveFrom,
                to: square,
            });
        } catch {
            // if invalid, setMoveFrom and getMoveOptions
            const hasMoveOptions = getMoveOptions(square as Square);

            // if new piece, setMoveFrom, otherwise clear moveFrom
            if (hasMoveOptions) {
                setMoveFrom(square);
            }

            // return early
            return;
        }

        // update the position state
        const newCoup = {
            from: moveFrom,
            to: square,
            piece: chessGame.get(square as Square)?.type || '',
        } as Coup;
        setChessPosition(chessGame.fen());
        handleMove(newCoup);


        // clear moveFrom and optionSquares
        setMoveFrom('');
        setOptionSquares({});
    }

    // handle piece drop
    function onPieceDrop({
        sourceSquare,
        targetSquare
    }: PieceDropHandlerArgs) {
        // type narrow targetSquare potentially being null (e.g. if dropped off board)
        if (!targetSquare) {
            return false;
        }

        const piece = chessGame.get(sourceSquare as Square);
        const isWhitePromotion = piece?.type === 'p' && piece?.color === 'w' && targetSquare[1] === '8';
        const isBlackPromotion = piece?.type === 'p' && piece?.color === 'b' && targetSquare[1] === '1';

        if (isWhitePromotion || isBlackPromotion) {
            setPromotionMove({ sourceSquare, targetSquare });
            return true;
        }



        // try to make the move according to chess.js logic
        try {
            chessGame.move({
                from: sourceSquare,
                to: targetSquare,
            });

            // update the position state upon successful move to trigger a re-render of the chessboard

            // clear moveFrom and optionSquares
            setMoveFrom('');
            setOptionSquares({});

            const newCoup = {
                from: sourceSquare,
                to: targetSquare,
                piece: chessGame.get(targetSquare as Square)?.type || '',
            } as Coup;
            setChessPosition(chessGame.fen());
            handleMove(newCoup);
            // return true as the move was successful
            return true;
        } catch {
            // return false as the move was not successful
            return false;
        }
    }
    // handle promotion piece select
    function onPromotionPieceSelect(piece: PieceSymbol) {
        try {
            chessGame.move({
                from: promotionMove!.sourceSquare,
                to: promotionMove!.targetSquare as Square,
                promotion: piece
            });

            // update the game state
            setChessPosition(chessGame.fen());
        } catch {
            // do nothing
        }

        // reset the promotion move to clear the promotion dialog
        setPromotionMove(null);
    }

    // calculate the left position of the promotion square
    const squareWidth = document.querySelector(`[data-column="a"][data-row="1"]`)?.getBoundingClientRect()?.width ?? 0;
    const promotionSquareLeft = promotionMove?.targetSquare ? squareWidth * chessColumnToColumnIndex(promotionMove.targetSquare.match(/^[a-z]+/)?.[0] ?? '', 8,
        // number of columns
        'white' // board orientation
    ) : 0;
    function onDragStart(piece: any, sourceSquare: any) {
        getMoveOptions(sourceSquare as Square);
        return true;
    }

    // Animation si le roi est en échec
    const [checkKingSquare, setCheckKingSquare] = useState('');
    useEffect(() => {
        if (chessGame.isCheckmate()) {
            const turn = chessGame.turn();
            const kingSquare = Object.keys(
                chessGame.board().reduce((acc, row, i) => {
                    row.forEach((piece, j) => {
                        if (piece && piece.type === 'k' && piece.color === turn) {
                            acc[String.fromCharCode(97 + j) + (8 - i)] = true;
                        }
                    });
                    return acc;
                }, {} as Record<string, boolean>)
            );
            setCheckKingSquare(kingSquare[0]);
        } else {
            setCheckKingSquare('');
        }
    }, [chessPosition]);


    const customSquareStyles = checkKingSquare
        ? {
            [checkKingSquare]: {
                background: 'linear-gradient(135deg, #ff4e50 0%, #f9d423 100%)',
                boxShadow: '0 0 16px 4px #ff4e50',
            }
        }
        : {};


    const chessboardOptions = {
        onPieceDrop,
        onDragStart,
        onSquareClick,
        position: chessPosition,
        squareStyles: { ...optionSquares, ...customSquareStyles },


    };

    // render the chessboard
    return (
        <div className="chess-bg">
            <div className="chessboard-wrapper" style={{ width: 400, height: 400 }}>
                <Chessboard
                    options={chessboardOptions}
                />
            </div>
            {/* Modale de promotion */}
            {promotionMove && (
                <div
                    style={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(0,0,0,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: 12,
                            padding: 24,
                            boxShadow: "0 4px 16px rgba(44,62,80,0.12)",
                            display: "flex",
                            gap: 24,
                        }}
                    >
                        {PROMOTION_PIECES.map(piece => (
                            <button
                                key={piece}
                                className="chess-btn"
                                style={{ fontSize: "2rem" }}
                                onClick={() => onPromotionPieceSelect(piece)}
                            >
                                {piece === "q" ? "♕" : piece === "r" ? "♖" : piece === "b" ? "♗" : "♘"}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};





export default Echiquier;
