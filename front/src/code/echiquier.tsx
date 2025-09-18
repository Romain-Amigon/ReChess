import React, { useRef, useState, useEffect } from "react";
import { Chess, PieceSymbol, Square } from "chess.js";
import { Chessboard, SquareHandlerArgs, PieceDropHandlerArgs, chessColumnToColumnIndex } from "react-chessboard";
import '../styles/global.css';
import { Coup } from "./Historique";

const PROMOTION_PIECES: PieceSymbol[] = ["q", "r", "b", "n"];

type EchiquierProps = {
    position?: string;
    onMove?: (coup: Coup) => void;
    BoardSize?: number;
};

const Echiquier: React.FC<EchiquierProps> = React.memo(({ position, onMove, BoardSize }) => {
    const chessGameRef = useRef(new Chess(position));
    const [chessPosition, setChessPosition] = useState(position || chessGameRef.current.fen());
    const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>(
        (localStorage.getItem('boardOrientation') as 'white' | 'black') || 'white'
    );
    const [moveFrom, setMoveFrom] = useState('');
    const [optionSquares, setOptionSquares] = useState({});
    const [promotionMove, setPromotionMove] = useState<Omit<PieceDropHandlerArgs, 'piece'> | null>(null);
    const [checkKingSquare, setCheckKingSquare] = useState('');
    const calcBoardSize = () => Math.floor(window.innerWidth * 0.3);
    const [boardSize, setBoardSize] = useState(BoardSize ? BoardSize : calcBoardSize);
    const moveSound = useRef<HTMLAudioElement | null>(null);

    // Sauvegarder boardOrientation dans localStorage
    useEffect(() => {
        localStorage.setItem('boardOrientation', boardOrientation);
    }, [boardOrientation]);

    // Synchroniser avec la prop position
    useEffect(() => {
        if (position && position !== chessGameRef.current.fen()) {
            chessGameRef.current = new Chess(position);
            setChessPosition(position);
            setMoveFrom('');
            setOptionSquares({});
            setPromotionMove(null);
        }
    }, [position]);

    // Initialiser le son
    useEffect(() => {
        moveSound.current = new Audio("/move-self.mp3");
    }, []);

    // Gérer le redimensionnement
    useEffect(() => {
        const handleResize = () => {
            setBoardSize(calcBoardSize());
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Vérifier l'échec
    useEffect(() => {
        if (chessGameRef.current.isCheckmate()) {
            const turn = chessGameRef.current.turn();
            const kingSquare = Object.keys(
                chessGameRef.current.board().reduce((acc, row, i) => {
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

    function getMoveOptions(square: Square) {
        const moves = chessGameRef.current.moves({ square, verbose: true });
        if (moves.length === 0) {
            setOptionSquares({});
            return false;
        }

        const newSquares: Record<string, React.CSSProperties> = {};
        for (const move of moves) {
            newSquares[move.to] = {
                background:
                    chessGameRef.current.get(move.to) &&
                        chessGameRef.current.get(move.to)?.color !== chessGameRef.current.get(square)?.color
                        ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
                        : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
                borderRadius: '50%',
            };
        }
        newSquares[square] = { background: 'rgba(255, 255, 0, 0.4)' };
        setOptionSquares(newSquares);
        return true;
    }

    function handleMove(coup: Coup) {
        if (onMove) onMove(coup);
    }

    function onSquareClick({ square, piece }: SquareHandlerArgs) {
        if (!moveFrom && piece) {
            const hasMoveOptions = getMoveOptions(square as Square);
            if (hasMoveOptions) {
                setMoveFrom(square);
            }
            return;
        }

        const moves = chessGameRef.current.moves({ square: moveFrom as Square, verbose: true });
        const foundMove = moves.find(m => m.from === moveFrom && m.to === square);
        if (!foundMove) {
            const hasMoveOptions = getMoveOptions(square as Square);
            setMoveFrom(hasMoveOptions ? square : '');
            return;
        }

        const movingPiece = chessGameRef.current.get(moveFrom as Square);
        const isWhitePromotion = movingPiece?.type === 'p' && movingPiece?.color === 'w' && square[1] === '8';
        const isBlackPromotion = movingPiece?.type === 'p' && movingPiece?.color === 'b' && square[1] === '1';

        if (isWhitePromotion || isBlackPromotion) {
            setPromotionMove({ sourceSquare: moveFrom, targetSquare: square });
            return;
        }

        try {
            chessGameRef.current.move({ from: moveFrom, to: square });
            const newCoup = {
                from: moveFrom,
                to: square,
                piece: chessGameRef.current.get(square as Square)?.type || '',
            } as Coup;
            setChessPosition(chessGameRef.current.fen());
            handleMove(newCoup);
            setMoveFrom('');
            setOptionSquares({});
            moveSound.current?.play();
        } catch {
            const hasMoveOptions = getMoveOptions(square as Square);
            setMoveFrom(hasMoveOptions ? square : '');
        }
    }

    function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
        if (!targetSquare) return false;

        const piece = chessGameRef.current.get(sourceSquare as Square);
        const isWhitePromotion = piece?.type === 'p' && piece?.color === 'w' && targetSquare[1] === '8';
        const isBlackPromotion = piece?.type === 'p' && piece?.color === 'b' && targetSquare[1] === '1';

        if (isWhitePromotion || isBlackPromotion) {
            setPromotionMove({ sourceSquare, targetSquare });
            return true;
        }

        try {
            chessGameRef.current.move({ from: sourceSquare, to: targetSquare });
            const newCoup = {
                from: sourceSquare,
                to: targetSquare,
                piece: chessGameRef.current.get(targetSquare as Square)?.type || '',
            } as Coup;
            setChessPosition(chessGameRef.current.fen());
            handleMove(newCoup);
            setMoveFrom('');
            setOptionSquares({});
            moveSound.current?.play();
            return true;
        } catch {
            return false;
        }
    }

    function onPromotionPieceSelect(piece: PieceSymbol) {
        try {
            chessGameRef.current.move({
                from: promotionMove!.sourceSquare,
                to: promotionMove!.targetSquare as Square,
                promotion: piece,
            });
            const newCoup = {
                from: promotionMove!.sourceSquare,
                to: promotionMove!.targetSquare,
                piece,
            } as Coup;
            setChessPosition(chessGameRef.current.fen());
            handleMove(newCoup);
            setPromotionMove(null);
            moveSound.current?.play();
        } catch {
            setPromotionMove(null);
        }
    }

    function onDragStart(piece: any, sourceSquare: any) {
        getMoveOptions(sourceSquare as Square);
        return true;
    }

    function flip() {
        setBoardOrientation(prev => (prev === 'white' ? 'black' : 'white'));
    }

    const customSquareStyles = checkKingSquare
        ? { [checkKingSquare]: { background: 'linear-gradient(135deg, #ff4e50 0%, #f9d423 100%)', boxShadow: '0 0 16px 4px #ff4e50' } }
        : {};

    const chessboardOptions = {
        onPieceDrop,
        onDragStart,
        onSquareClick,
        boardOrientation,
        position: chessPosition,
        squareStyles: { ...optionSquares, ...customSquareStyles },
    };

    const squareWidth = document.querySelector(`[data-column="a"][data-row="1"]`)?.getBoundingClientRect()?.width ?? 0;
    const promotionSquareLeft = promotionMove?.targetSquare
        ? squareWidth * chessColumnToColumnIndex(promotionMove.targetSquare.match(/^[a-z]+/)?.[0] ?? '', 8, 'white')
        : 0;

    return (
        <div className="chess-bg">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="chessboard-wrapper" style={{ width: boardSize, height: boardSize }}>
                    <Chessboard options={chessboardOptions} />
                </div>
                <div style={{ justifyContent: 'center' }}>
                    <button onClick={flip}>Flip Board</button>
                </div>
            </div>
            {promotionMove && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: 12,
                            padding: 24,
                            boxShadow: '0 4px 16px rgba(44,62,80,0.12)',
                            display: 'flex',
                            gap: 24,
                        }}
                    >
                        {PROMOTION_PIECES.map(piece => (
                            <button
                                key={piece}
                                className="chess-btn"
                                style={{ fontSize: '2rem' }}
                                onClick={() => onPromotionPieceSelect(piece)}
                            >
                                {piece === 'q' ? '♕' : piece === 'r' ? '♖' : piece === 'b' ? '♗' : '♘'}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

export default Echiquier;