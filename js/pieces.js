// 駒の定義と移動ルール

const PIECE_TYPES = {
    KING: '王',
    ROOK: '飛',
    BISHOP: '角',
    GOLD: '金',
    SILVER: '銀',
    KNIGHT: '桂',
    LANCE: '香',
    PAWN: '歩',
    // 成り駒
    PROMOTED_ROOK: '龍',
    PROMOTED_BISHOP: '馬',
    PROMOTED_SILVER: '成銀',
    PROMOTED_KNIGHT: '成桂',
    PROMOTED_LANCE: '成香',
    PROMOTED_PAWN: 'と'
};

// 駒の移動可能な方向を定義
const MOVE_PATTERNS = {
    [PIECE_TYPES.KING]: [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0],           [1, 0],
        [-1, 1],  [0, 1],  [1, 1]
    ],
    [PIECE_TYPES.GOLD]: [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0],           [1, 0],
                  [0, 1]
    ],
    [PIECE_TYPES.SILVER]: [
        [-1, -1], [0, -1], [1, -1],
        [-1, 1],           [1, 1]
    ],
    [PIECE_TYPES.KNIGHT]: [
        [-1, -2], [1, -2]
    ],
    [PIECE_TYPES.PAWN]: [
        [0, -1]
    ],
    // 成り駒は金と同じ動き
    [PIECE_TYPES.PROMOTED_SILVER]: [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0],           [1, 0],
                  [0, 1]
    ],
    [PIECE_TYPES.PROMOTED_KNIGHT]: [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0],           [1, 0],
                  [0, 1]
    ],
    [PIECE_TYPES.PROMOTED_LANCE]: [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0],           [1, 0],
                  [0, 1]
    ],
    [PIECE_TYPES.PROMOTED_PAWN]: [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0],           [1, 0],
                  [0, 1]
    ]
};

// 飛び駒（飛車、角、香車）の移動方向
const LINE_MOVE_PATTERNS = {
    [PIECE_TYPES.ROOK]: [
        [0, -1], [1, 0], [0, 1], [-1, 0]
    ],
    [PIECE_TYPES.BISHOP]: [
        [-1, -1], [1, -1], [1, 1], [-1, 1]
    ],
    [PIECE_TYPES.LANCE]: [
        [0, -1]
    ],
    [PIECE_TYPES.PROMOTED_ROOK]: [
        [0, -1], [1, 0], [0, 1], [-1, 0], // 飛車の動き
        [-1, -1], [1, -1], [1, 1], [-1, 1] // 1マスだけ斜め
    ],
    [PIECE_TYPES.PROMOTED_BISHOP]: [
        [-1, -1], [1, -1], [1, 1], [-1, 1], // 角の動き
        [0, -1], [1, 0], [0, 1], [-1, 0] // 1マスだけ縦横
    ]
};

// 駒クラス
class Piece {
    constructor(type, player, position) {
        this.type = type;
        this.player = player;
        this.position = position;
        this.promoted = false;
        this.isNew = false;
        this.isMoved = false;
    }

    // 駒を成る
    promote() {
        if (this.canPromote() && !this.promoted) {
            switch (this.type) {
                case PIECE_TYPES.ROOK:
                    this.type = PIECE_TYPES.PROMOTED_ROOK;
                    break;
                case PIECE_TYPES.BISHOP:
                    this.type = PIECE_TYPES.PROMOTED_BISHOP;
                    break;
                case PIECE_TYPES.SILVER:
                    this.type = PIECE_TYPES.PROMOTED_SILVER;
                    break;
                case PIECE_TYPES.KNIGHT:
                    this.type = PIECE_TYPES.PROMOTED_KNIGHT;
                    break;
                case PIECE_TYPES.LANCE:
                    this.type = PIECE_TYPES.PROMOTED_LANCE;
                    break;
                case PIECE_TYPES.PAWN:
                    this.type = PIECE_TYPES.PROMOTED_PAWN;
                    break;
            }
            this.promoted = true;
        }
    }

    // 成ることができるかチェック
    canPromote() {
        const promotablePieces = [
            PIECE_TYPES.ROOK, PIECE_TYPES.BISHOP, PIECE_TYPES.SILVER,
            PIECE_TYPES.KNIGHT, PIECE_TYPES.LANCE, PIECE_TYPES.PAWN
        ];
        return promotablePieces.includes(this.type);
    }

    // 敵陣に入っているかチェック
    isInPromotionZone() {
        if (this.player === 1) {
            return this.position.y <= 2;
        } else {
            return this.position.y >= 6;
        }
    }

    // 可能な移動先を取得
    getPossibleMoves(board) {
        const moves = [];
        const { x, y } = this.position;

        // 飛び駒の場合
        if (LINE_MOVE_PATTERNS[this.type]) {
            const patterns = LINE_MOVE_PATTERNS[this.type];
            for (const [dx, dy] of patterns) {
                // 龍王と龍馬の1マス移動
                if ((this.type === PIECE_TYPES.PROMOTED_ROOK && Math.abs(dx) === 1 && Math.abs(dy) === 1) ||
                    (this.type === PIECE_TYPES.PROMOTED_BISHOP && (Math.abs(dx) + Math.abs(dy) === 1))) {
                    const newX = x + dx;
                    const newY = y + (this.player === 1 ? dy : -dy);
                    if (this.isValidMove(newX, newY, board)) {
                        moves.push({ x: newX, y: newY });
                    }
                } else {
                    // 通常の飛び駒の動き
                    for (let i = 1; i < 9; i++) {
                        const newX = x + dx * i;
                        const newY = y + (this.player === 1 ? dy * i : -dy * i);
                        
                        if (!this.isInBounds(newX, newY)) break;
                        
                        const targetCell = board[newY][newX];
                        if (!targetCell) {
                            moves.push({ x: newX, y: newY });
                        } else {
                            if (targetCell.player !== this.player) {
                                moves.push({ x: newX, y: newY });
                            }
                            break;
                        }
                    }
                }
            }
        } else {
            // 通常の駒の場合
            const patterns = MOVE_PATTERNS[this.type] || [];
            for (const [dx, dy] of patterns) {
                const newX = x + dx;
                const newY = y + (this.player === 1 ? dy : -dy);
                
                if (this.isValidMove(newX, newY, board)) {
                    moves.push({ x: newX, y: newY });
                }
            }
        }

        return moves;
    }

    // 移動が有効かチェック
    isValidMove(x, y, board) {
        if (!this.isInBounds(x, y)) return false;
        
        const targetCell = board[y][x];
        if (!targetCell) return true;
        
        // 相手の駒の場合（王将も取れる）
        if (targetCell.player !== this.player) {
            return true;
        }
        
        return false;
    }

    // 盤面の範囲内かチェック
    isInBounds(x, y) {
        return x >= 0 && x < 9 && y >= 0 && y < 9;
    }
}

// 二歩チェック
function checkDoublePawn(board, player, x) {
    for (let y = 0; y < 9; y++) {
        const piece = board[y][x];
        if (piece && piece.player === player && piece.type === PIECE_TYPES.PAWN) {
            return true;
        }
    }
    return false;
}