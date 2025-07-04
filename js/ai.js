// AI対戦機能

class AI {
    constructor(difficulty) {
        this.difficulty = difficulty;
        this.player = 2; // AIは常に後手
    }

    // 次の手を取得
    getNextMove(board, cardSystem) {
        switch (this.difficulty) {
            case 'easy':
                return this.getEasyMove(board, cardSystem);
            case 'medium':
                return this.getMediumMove(board, cardSystem);
            case 'hard':
                return this.getHardMove(board, cardSystem);
            default:
                return this.getEasyMove(board, cardSystem);
        }
    }

    // 初級AI: ランダムな手を選択
    getEasyMove(board, cardSystem) {
        const possibleMoves = this.getAllPossibleMoves(board, cardSystem);
        
        if (possibleMoves.length === 0) {
            return null;
        }
        
        // ランダムに選択
        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        return possibleMoves[randomIndex];
    }

    // 中級AI: 基本的な評価関数を使用
    getMediumMove(board, cardSystem) {
        const possibleMoves = this.getAllPossibleMoves(board, cardSystem);
        
        if (possibleMoves.length === 0) {
            return null;
        }
        
        // 各手を評価
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of possibleMoves) {
            const score = this.evaluateMove(move, board, cardSystem);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    // 上級AI: ミニマックス法を使用
    getHardMove(board, cardSystem) {
        // 簡易版として中級AIと同じ処理
        // 本格的な実装では深さ制限付きミニマックス法を実装
        return this.getMediumMove(board, cardSystem);
    }

    // すべての可能な手を取得
    getAllPossibleMoves(board, cardSystem) {
        const moves = [];
        
        // 駒の移動を収集
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = board.cells[y][x];
                if (piece && piece.player === this.player) {
                    const possibleMoves = piece.getPossibleMoves(board.cells);
                    for (const move of possibleMoves) {
                        moves.push({
                            type: 'move',
                            from: { x, y },
                            to: move,
                            piece: piece
                        });
                    }
                }
            }
        }
        
        // カードの使用を収集
        const hand = cardSystem.player2Hand;
        const summonPositions = board.getKingSurroundingEmptyCells(this.player);
        
        for (const card of hand) {
            for (const pos of summonPositions) {
                // 二歩チェック
                if (card.pieceType === PIECE_TYPES.PAWN && 
                    checkDoublePawn(board.cells, this.player, pos.x)) {
                    continue;
                }
                
                moves.push({
                    type: 'summon',
                    card: card,
                    position: pos
                });
            }
        }
        
        return moves;
    }

    // 手を評価
    evaluateMove(move, board, cardSystem) {
        let score = 0;
        
        if (move.type === 'move') {
            // 相手の駒を取る場合は高評価
            const targetPiece = board.cells[move.to.y][move.to.x];
            if (targetPiece) {
                // 王将を取る場合は最高評価
                if (targetPiece.type === PIECE_TYPES.KING) {
                    score += 10000;
                } else {
                    score += this.getPieceValue(targetPiece.type) * 10;
                }
            }
            
            // 相手の王将の初期位置周辺への配置を評価
            const enemyInitialPos = { x: 4, y: 8 }; // 先手の初期位置
            const targetPositions = [
                enemyInitialPos,
                { x: enemyInitialPos.x - 1, y: enemyInitialPos.y },
                { x: enemyInitialPos.x + 1, y: enemyInitialPos.y },
                { x: enemyInitialPos.x, y: enemyInitialPos.y - 1 },
                { x: enemyInitialPos.x - 1, y: enemyInitialPos.y - 1 },
                { x: enemyInitialPos.x + 1, y: enemyInitialPos.y - 1 }
            ];
            
            // 目標位置に移動する場合
            for (const pos of targetPositions) {
                if (move.to.x === pos.x && move.to.y === pos.y) {
                    score += 50;
                    
                    // 既に1つ以上配置されている場合
                    let count = 0;
                    for (const checkPos of targetPositions) {
                        if (checkPos.x === move.to.x && checkPos.y === move.to.y) continue;
                        if (checkPos.x >= 0 && checkPos.x < 9 && checkPos.y >= 0 && checkPos.y < 9) {
                            const piece = board.cells[checkPos.y][checkPos.x];
                            if (piece && piece.player === this.player) {
                                count++;
                            }
                        }
                    }
                    if (count >= 1) {
                        score += 2000; // 勝利条件満たす
                    }
                    break;
                }
            }
            
            // 相手の王将に近づく手も評価
            const enemyKingPos = this.findKingPosition(board, 1);
            if (enemyKingPos) {
                const currentDistance = Math.abs(move.from.x - enemyKingPos.x) + 
                                      Math.abs(move.from.y - enemyKingPos.y);
                const newDistance = Math.abs(move.to.x - enemyKingPos.x) + 
                                   Math.abs(move.to.y - enemyKingPos.y);
                score += (currentDistance - newDistance) * 3;
            }
        } else if (move.type === 'summon') {
            // 強い駒の召喚は高評価
            score += this.getPieceValue(move.card.pieceType);
            
            // 目標位置に召喚する場合
            const enemyInitialPos = { x: 4, y: 8 };
            const targetPositions = [
                enemyInitialPos,
                { x: enemyInitialPos.x - 1, y: enemyInitialPos.y },
                { x: enemyInitialPos.x + 1, y: enemyInitialPos.y },
                { x: enemyInitialPos.x, y: enemyInitialPos.y - 1 },
                { x: enemyInitialPos.x - 1, y: enemyInitialPos.y - 1 },
                { x: enemyInitialPos.x + 1, y: enemyInitialPos.y - 1 }
            ];
            
            for (const pos of targetPositions) {
                if (move.position.x === pos.x && move.position.y === pos.y) {
                    score += 40;
                    break;
                }
            }
        }
        
        return score;
    }

    // 駒の価値を取得
    getPieceValue(pieceType) {
        const values = {
            [PIECE_TYPES.PAWN]: 1,
            [PIECE_TYPES.LANCE]: 3,
            [PIECE_TYPES.KNIGHT]: 3,
            [PIECE_TYPES.SILVER]: 5,
            [PIECE_TYPES.GOLD]: 6,
            [PIECE_TYPES.BISHOP]: 8,
            [PIECE_TYPES.ROOK]: 10,
            [PIECE_TYPES.PROMOTED_PAWN]: 6,
            [PIECE_TYPES.PROMOTED_LANCE]: 6,
            [PIECE_TYPES.PROMOTED_KNIGHT]: 6,
            [PIECE_TYPES.PROMOTED_SILVER]: 6,
            [PIECE_TYPES.PROMOTED_BISHOP]: 10,
            [PIECE_TYPES.PROMOTED_ROOK]: 12
        };
        return values[pieceType] || 0;
    }

    // 王将の位置を検索
    findKingPosition(board, player) {
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = board.cells[y][x];
                if (piece && piece.type === PIECE_TYPES.KING && piece.player === player) {
                    return { x, y };
                }
            }
        }
        return null;
    }

    // 王将の周囲かどうかチェック
    isAroundKing(position, kingPosition) {
        if (!kingPosition) return false;
        
        const dx = Math.abs(position.x - kingPosition.x);
        const dy = Math.abs(position.y - kingPosition.y);
        
        return dx <= 1 && dy <= 1 && (dx !== 0 || dy !== 0);
    }

    // 王将の周囲にある駒の数を数える
    countSurroundingPieces(board, kingPosition, player) {
        if (!kingPosition) return 0;
        
        let count = 0;
        const surroundingPositions = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0],           [1, 0],
            [-1, 1],  [0, 1],  [1, 1]
        ];
        
        for (const [dx, dy] of surroundingPositions) {
            const x = kingPosition.x + dx;
            const y = kingPosition.y + dy;
            
            if (x >= 0 && x < 9 && y >= 0 && y < 9) {
                const piece = board.cells[y][x];
                if (piece && piece.player === player) {
                    count++;
                }
            }
        }
        
        return count;
    }
}