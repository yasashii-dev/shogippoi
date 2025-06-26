// 将棋盤の管理

class Board {
    constructor() {
        this.cells = this.initializeBoard();
        this.selectedPiece = null;
        this.currentPlayer = 1;
        this.boardElement = document.getElementById('game-board');
        this.initializeBoardUI();
    }

    // 盤面の初期化
    initializeBoard() {
        const board = [];
        for (let y = 0; y < 9; y++) {
            board[y] = [];
            for (let x = 0; x < 9; x++) {
                board[y][x] = null;
            }
        }
        
        // 王将の初期配置
        board[8][4] = new Piece(PIECE_TYPES.KING, 1, { x: 4, y: 8 }); // 先手の王将
        board[0][4] = new Piece(PIECE_TYPES.KING, 2, { x: 4, y: 0 }); // 後手の王将
        
        return board;
    }

    // 盤面UIの初期化
    initializeBoardUI() {
        this.boardElement.innerHTML = '';
        
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.addEventListener('click', (e) => this.handleCellClick(e));
                this.boardElement.appendChild(cell);
            }
        }
        
        this.render();
    }

    // セルクリックの処理
    handleCellClick(event) {
        const cellElement = event.target.closest('.cell');
        if (!cellElement) return;
        
        const x = parseInt(cellElement.dataset.x);
        const y = parseInt(cellElement.dataset.y);
        
        if (this.selectedPiece) {
            // 駒が選択されている場合は移動を試みる
            this.tryMovePiece(x, y);
        } else {
            // 駒を選択
            this.selectPiece(x, y);
        }
    }

    // 駒を選択
    selectPiece(x, y) {
        const piece = this.cells[y][x];
        
        if (piece && piece.player === this.currentPlayer) {
            // 駒をクリックしたら自動的に駒移動モードに
            if (game && !game.hasPerformedAction) {
                game.currentTurnAction = 'piece';
                game.updateActionModeUI();
                
                // カードの選択をクリア
                if (game.cardSystem) {
                    game.cardSystem.clearCardSelection();
                }
            } else if (game && game.hasPerformedAction) {
                game.showModal('アクション済み', 'このターンは既にアクションを実行しています。');
                return;
            }
            
            this.selectedPiece = { x, y, piece };
            this.highlightPossibleMoves();
            this.render();
        }
    }

    // 駒の移動を試みる
    tryMovePiece(toX, toY) {
        const { x: fromX, y: fromY, piece } = this.selectedPiece;
        const possibleMoves = piece.getPossibleMoves(this.cells);
        
        const isValidMove = possibleMoves.some(move => move.x === toX && move.y === toY);
        
        if (isValidMove) {
            // 移動実行
            this.movePiece(fromX, fromY, toX, toY);
            
            // アクション実行済みとしてマーク
            if (game) {
                game.hasPerformedAction = true;
                game.updateActionModeUI();
            }
            
            // 成りの判定
            if (piece.canPromote() && (piece.isInPromotionZone() || this.wasInPromotionZone(fromY, piece.player))) {
                this.promptPromotion(piece);
            }
            
            // ターン終了
            this.endTurn();
        } else {
            // 無効な移動の場合は選択を解除
            this.clearSelection();
        }
    }

    // 駒を移動
    movePiece(fromX, fromY, toX, toY) {
        const piece = this.cells[fromY][fromX];
        const capturedPiece = this.cells[toY][toX];
        
        // 取られた駒の処理
        if (capturedPiece) {
            this.addToCaptured(capturedPiece);
        }
        
        // 移動
        this.cells[toY][toX] = piece;
        this.cells[fromY][fromX] = null;
        piece.position = { x: toX, y: toY };
    }

    // 成りのプロンプト
    promptPromotion(piece) {
        if (confirm('成りますか？')) {
            piece.promote();
        }
    }

    // 元々敵陣にいたかチェック
    wasInPromotionZone(fromY, player) {
        if (player === 1) {
            return fromY <= 2;
        } else {
            return fromY >= 6;
        }
    }

    // 可能な移動先をハイライト
    highlightPossibleMoves() {
        const { piece } = this.selectedPiece;
        const possibleMoves = piece.getPossibleMoves(this.cells);
        
        // すべてのセルのハイライトをクリア
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'valid-move');
        });
        
        // 選択中のセルをハイライト
        const selectedCell = document.querySelector(`.cell[data-x="${this.selectedPiece.x}"][data-y="${this.selectedPiece.y}"]`);
        if (selectedCell) {
            selectedCell.classList.add('selected');
        }
        
        // 移動可能なセルをハイライト
        possibleMoves.forEach(move => {
            const cell = document.querySelector(`.cell[data-x="${move.x}"][data-y="${move.y}"]`);
            if (cell) {
                cell.classList.add('valid-move');
            }
        });
    }

    // 選択をクリア
    clearSelection() {
        this.selectedPiece = null;
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'valid-move');
        });
        this.render();
    }

    // 取られた駒を追加
    addToCaptured(piece) {
        const capturedList = document.querySelector(`#captured${this.currentPlayer} .captured-list`);
        const pieceElement = document.createElement('div');
        pieceElement.className = `piece player${this.currentPlayer}`;
        pieceElement.textContent = piece.type;
        capturedList.appendChild(pieceElement);
    }

    // ターン終了
    endTurn() {
        this.clearSelection();
        
        // game.jsのendTurnを呼び出し（プレイヤー切り替えとアクション状態のリセットを統一）
        if (game) {
            game.endTurn();
        } else {
            // gameがない場合は直接プレイヤーを切り替え
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            document.getElementById('current-player').textContent = 
                this.currentPlayer === 1 ? '先手のターン' : '後手のターン';
            
            // 勝利判定
            const victoryResult = this.checkVictory();
            if (victoryResult.victory) {
                this.handleGameEnd(victoryResult.reason);
            }
        }
    }

    // 勝利判定
    checkVictory() {
        // 相手の王将の位置を探す
        const opponentPlayer = this.currentPlayer === 1 ? 2 : 1;
        let kingPosition = null;
        let kingFound = false;
        
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = this.cells[y][x];
                if (piece && piece.type === PIECE_TYPES.KING && piece.player === opponentPlayer) {
                    kingPosition = { x, y };
                    kingFound = true;
                    break;
                }
            }
            if (kingFound) break;
        }
        
        // 王将が取られた場合
        if (!kingFound) {
            return { victory: true, reason: 'king_captured' };
        }
        
        // 相手の王将の初期位置を確認
        const initialKingPosition = opponentPlayer === 1 ? { x: 4, y: 8 } : { x: 4, y: 0 };
        
        // 初期位置とその周囲5マスを定義
        const targetPositions = [
            { x: initialKingPosition.x, y: initialKingPosition.y }, // 初期位置
            { x: initialKingPosition.x - 1, y: initialKingPosition.y }, // 左
            { x: initialKingPosition.x + 1, y: initialKingPosition.y }, // 右
            { x: initialKingPosition.x, y: initialKingPosition.y + (opponentPlayer === 1 ? -1 : 1) }, // 前
            { x: initialKingPosition.x - 1, y: initialKingPosition.y + (opponentPlayer === 1 ? -1 : 1) }, // 左前
            { x: initialKingPosition.x + 1, y: initialKingPosition.y + (opponentPlayer === 1 ? -1 : 1) } // 右前
        ];
        
        // 指定位置に自分の駒が何個あるかカウント
        let pieceCount = 0;
        for (const pos of targetPositions) {
            if (pos.x >= 0 && pos.x < 9 && pos.y >= 0 && pos.y < 9) {
                const piece = this.cells[pos.y][pos.x];
                if (piece && piece.player === this.currentPlayer) {
                    pieceCount++;
                }
            }
        }
        
        if (pieceCount >= 2) {
            return { victory: true, reason: 'zone_control' };
        }
        
        return { victory: false };
    }

    // ゲーム終了処理
    handleGameEnd(reason) {
        const winner = this.currentPlayer === 1 ? '先手' : '後手';
        let message = '';
        if (reason === 'king_captured') {
            message = `${winner}の勝利！\n相手の王将を取りました。`;
        } else if (reason === 'zone_control') {
            message = `${winner}の勝利！\n相手の王将の初期位置周辺を制圧しました。`;
        }
        alert(message);
        // ゲームリセットなどの処理
    }

    // 盤面を描画
    render() {
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach((cell, index) => {
            const x = index % 9;
            const y = Math.floor(index / 9);
            const piece = this.cells[y][x];
            
            cell.innerHTML = '';
            
            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.className = `piece player${piece.player}`;
                pieceElement.textContent = piece.type;
                cell.appendChild(pieceElement);
            }
        });
    }

    // 駒を召喚（カードから）
    summonPiece(pieceType, x, y) {
        if (this.cells[y][x] === null) {
            const newPiece = new Piece(pieceType, this.currentPlayer, { x, y });
            this.cells[y][x] = newPiece;
            this.render();
            return true;
        }
        return false;
    }

    // 王将の周囲の空きマスを取得
    getKingSurroundingEmptyCells(player) {
        let kingPosition = null;
        
        // 王将の位置を探す
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const piece = this.cells[y][x];
                if (piece && piece.type === PIECE_TYPES.KING && piece.player === player) {
                    kingPosition = { x, y };
                    break;
                }
            }
            if (kingPosition) break;
        }
        
        if (!kingPosition) return [];
        
        const emptyCells = [];
        const surroundingPositions = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0],           [1, 0],
            [-1, 1],  [0, 1],  [1, 1]
        ];
        
        for (const [dx, dy] of surroundingPositions) {
            const x = kingPosition.x + dx;
            const y = kingPosition.y + dy;
            
            if (x >= 0 && x < 9 && y >= 0 && y < 9 && !this.cells[y][x]) {
                emptyCells.push({ x, y });
            }
        }
        
        return emptyCells;
    }
}