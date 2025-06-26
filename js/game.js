// ゲーム全体の管理

class Game {
    constructor() {
        this.board = null;
        this.cardSystem = null;
        this.gameMode = null; // 'pvp' or 'pve'
        this.aiDifficulty = null;
        this.gameStarted = false;
        this.ai = null;
        this.currentTurnAction = null; // 'piece' or 'card' - tracks what action the player chose this turn
        this.hasPerformedAction = false; // tracks if an action has been performed this turn
    }

    // ゲームを初期化
    initialize() {
        this.board = new Board();
        this.cardSystem = new CardSystem();
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // 初期手札を配る
        this.cardSystem.dealInitialHands();
        
        // アクションモードUIを初期化
        this.updateActionModeUI();
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // 投了ボタン
        document.getElementById('surrender-btn').addEventListener('click', () => {
            if (confirm('投了しますか？')) {
                this.handleSurrender();
            }
        });
        
        // アクション選択ボタンは削除（自動選択に変更）

        // セルクリックイベントの拡張
        const originalHandleCellClick = this.board.handleCellClick.bind(this.board);
        this.board.handleCellClick = (event) => {
            const x = parseInt(event.target.dataset.x);
            const y = parseInt(event.target.dataset.y);
            
            // カードが選択されている場合
            if (this.cardSystem.selectedCard) {
                const cell = event.target.closest('.cell');
                if (cell.classList.contains('valid-summon')) {
                    // カードを使用して駒を召喚
                    if (this.cardSystem.useCard(x, y)) {
                        this.endTurn();
                    }
                }
            } else {
                // 通常の駒の移動処理
                originalHandleCellClick(event);
            }
        };
    }

    // ターン終了処理
    endTurn() {
        // 駒の選択をクリア
        this.board.clearSelection();
        
        // カードの選択をクリア
        this.cardSystem.clearCardSelection();
        
        // アクション選択をリセット
        this.currentTurnAction = null;
        this.hasPerformedAction = false;
        this.updateActionModeUI();
        
        // プレイヤーを切り替え
        this.board.currentPlayer = this.board.currentPlayer === 1 ? 2 : 1;
        document.getElementById('current-player').textContent = 
            this.board.currentPlayer === 1 ? '先手のターン' : '後手のターン';
        
        // 勝利判定
        const victoryResult = this.board.checkVictory();
        if (victoryResult.victory) {
            this.handleGameEnd(victoryResult.reason);
            return;
        }
        
        // 次のターンを開始
        this.startTurn();
    }

    // ターン開始処理
    startTurn() {
        // カードをドロー
        this.cardSystem.startTurn(this.board.currentPlayer);
        
        // AI対戦モードでAIのターンの場合
        if (this.gameMode === 'pve' && this.board.currentPlayer === 2) {
            setTimeout(() => {
                this.aiTurn();
            }, 1000);
        }
    }

    // AIのターン
    aiTurn() {
        if (this.ai) {
            const move = this.ai.getNextMove(this.board, this.cardSystem);
            if (move) {
                if (move.type === 'move') {
                    // 駒を移動
                    this.currentTurnAction = 'piece';
                    this.board.selectedPiece = {
                        x: move.from.x,
                        y: move.from.y,
                        piece: this.board.cells[move.from.y][move.from.x]
                    };
                    this.board.tryMovePiece(move.to.x, move.to.y);
                } else if (move.type === 'summon') {
                    // カードを使用
                    this.currentTurnAction = 'card';
                    this.cardSystem.selectedCard = move.card;
                    this.cardSystem.useCard(move.position.x, move.position.y);
                    this.endTurn();
                }
            } else {
                // 有効な手がない場合はパス
                this.endTurn();
            }
        }
    }

    // 投了処理
    handleSurrender() {
        const winner = this.board.currentPlayer === 1 ? '後手' : '先手';
        this.showModal('ゲーム終了', `${this.board.currentPlayer === 1 ? '先手' : '後手'}が投了しました。\n${winner}の勝利！`);
        this.resetGame();
    }

    // ゲーム終了処理
    handleGameEnd(reason) {
        const winner = this.board.currentPlayer === 1 ? '先手' : '後手';
        let message = '';
        if (reason === 'king_captured') {
            message = `${winner}の勝利！\n相手の王将を取りました。`;
        } else if (reason === 'zone_control') {
            message = `${winner}の勝利！\n相手の王将の初期位置周辺を制圧しました。`;
        }
        this.showModal('ゲーム終了', message);
        this.resetGame();
    }

    // モーダル表示
    showModal(title, message) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalCancel = document.getElementById('modal-cancel');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalCancel.classList.add('hidden');
        
        modal.classList.remove('hidden');
        
        document.getElementById('modal-confirm').onclick = () => {
            modal.classList.add('hidden');
        };
    }

    // ゲームをリセット
    resetGame() {
        setTimeout(() => {
            location.reload();
        }, 2000);
    }

    // アクションモードを選択（駒移動またはカード使用）
    selectActionMode(mode) {
        // 既にアクションを実行済みの場合は変更不可
        if (this.hasPerformedAction) {
            this.showModal('アクション済み', 'このターンは既にアクションを実行しています。');
            return;
        }
        
        // 同じモードを選択した場合は何もしない
        if (this.currentTurnAction === mode) {
            return;
        }
        
        // モードを切り替え
        this.currentTurnAction = mode;
        
        // 現在の選択をクリア
        this.board.clearSelection();
        this.cardSystem.clearCardSelection();
        
        // UIを更新
        this.updateActionModeUI();
    }
    
    // アクションモードUIを更新
    updateActionModeUI() {
        const actionStatus = document.getElementById('action-status');
        
        if (!actionStatus) return;
        
        // アクション済みの場合
        if (this.hasPerformedAction) {
            actionStatus.textContent = 'アクション実行済み';
            actionStatus.classList.add('action-completed');
        } else {
            actionStatus.textContent = this.currentTurnAction ? 
                `${this.currentTurnAction === 'piece' ? '駒移動' : 'カード使用'}モード` : 
                '';
            actionStatus.classList.remove('action-completed');
        }
    }
    
    // ゲームモードを設定
    setGameMode(mode, difficulty = null) {
        this.gameMode = mode;
        this.aiDifficulty = difficulty;
        
        if (mode === 'pve' && difficulty) {
            // AI を初期化
            this.ai = new AI(difficulty);
        }
        
        // ゲーム開始画面を非表示
        document.getElementById('start-screen').classList.add('hidden');
        
        // ゲームを初期化
        this.initialize();
        this.gameStarted = true;
    }
}

// グローバルなゲームインスタンス
let game = null;