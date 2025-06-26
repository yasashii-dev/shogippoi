// カードシステムの管理

class Card {
    constructor(pieceType) {
        this.pieceType = pieceType;
        this.id = Math.random().toString(36).substr(2, 9);
    }
}

class CardSystem {
    constructor() {
        this.player1Deck = this.createDeck();
        this.player2Deck = this.createDeck();
        this.player1Hand = [];
        this.player2Hand = [];
        this.selectedCard = null;
    }

    // デッキを作成
    createDeck() {
        const deck = [];
        
        // 各駒のカードを追加
        const pieceDistribution = {
            [PIECE_TYPES.PAWN]: 18,
            [PIECE_TYPES.LANCE]: 4,
            [PIECE_TYPES.KNIGHT]: 4,
            [PIECE_TYPES.SILVER]: 4,
            [PIECE_TYPES.GOLD]: 4,
            [PIECE_TYPES.BISHOP]: 2,
            [PIECE_TYPES.ROOK]: 2
        };
        
        for (const [pieceType, count] of Object.entries(pieceDistribution)) {
            for (let i = 0; i < count; i++) {
                deck.push(new Card(pieceType));
            }
        }
        
        // デッキをシャッフル
        return this.shuffleDeck(deck);
    }

    // デッキをシャッフル
    shuffleDeck(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // 初期手札を配る
    dealInitialHands() {
        for (let i = 0; i < 3; i++) {
            this.drawCard(1);
            this.drawCard(2);
        }
        this.renderHands();
    }

    // カードをドロー
    drawCard(player) {
        const deck = player === 1 ? this.player1Deck : this.player2Deck;
        const hand = player === 1 ? this.player1Hand : this.player2Hand;
        
        if (deck.length > 0) {
            const card = deck.pop();
            hand.push(card);
            this.updateDeckCount(player);
            return card;
        }
        return null;
    }

    // デッキ枚数を更新
    updateDeckCount(player) {
        const deck = player === 1 ? this.player1Deck : this.player2Deck;
        document.getElementById(`deck${player}-count`).textContent = deck.length;
    }

    // 手札を描画
    renderHands() {
        this.renderPlayerHand(1, this.player1Hand);
        this.renderPlayerHand(2, this.player2Hand);
    }

    // プレイヤーの手札を描画
    renderPlayerHand(player, hand) {
        const handElement = document.getElementById(`hand${player}`);
        handElement.innerHTML = '';
        
        hand.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.textContent = card.pieceType;
            cardElement.dataset.cardId = card.id;
            cardElement.dataset.player = player;
            
            // カードクリックイベント
            cardElement.addEventListener('click', (e) => this.handleCardClick(e));
            
            handElement.appendChild(cardElement);
        });
    }

    // カードクリックの処理
    handleCardClick(event) {
        const cardId = event.target.dataset.cardId;
        const player = parseInt(event.target.dataset.player);
        
        // 現在のプレイヤーのカードのみ選択可能
        if (player === game.board.currentPlayer) {
            // カードをクリックしたら自動的にカード使用モードに
            if (game && !game.hasPerformedAction) {
                game.currentTurnAction = 'card';
                game.updateActionModeUI();
                
                // 駒の選択をクリア
                if (game.board) {
                    game.board.clearSelection();
                }
            } else if (game && game.hasPerformedAction) {
                game.showModal('アクション済み', 'このターンは既にアクションを実行しています。');
                return;
            }
            
            // 既に選択されているカードがあればクリア
            if (this.selectedCard) {
                document.querySelector('.card.selected')?.classList.remove('selected');
            }
            
            // カードを選択
            this.selectedCard = this.findCardById(player, cardId);
            event.target.classList.add('selected');
            
            // 召喚可能な位置をハイライト
            this.highlightSummonPositions();
        }
    }

    // IDでカードを検索
    findCardById(player, cardId) {
        const hand = player === 1 ? this.player1Hand : this.player2Hand;
        return hand.find(card => card.id === cardId);
    }

    // 召喚可能な位置をハイライト
    highlightSummonPositions() {
        // すべてのハイライトをクリア
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('valid-summon');
        });
        
        if (!this.selectedCard) return;
        
        // 王将の周囲の空きマスを取得
        const emptyCells = game.board.getKingSurroundingEmptyCells(game.board.currentPlayer);
        
        // 二歩チェック（歩の場合）
        const validCells = emptyCells.filter(pos => {
            if (this.selectedCard.pieceType === PIECE_TYPES.PAWN) {
                return !checkDoublePawn(game.board.cells, game.board.currentPlayer, pos.x);
            }
            return true;
        });
        
        // 有効なセルをハイライト
        validCells.forEach(pos => {
            const cell = document.querySelector(`.cell[data-x="${pos.x}"][data-y="${pos.y}"]`);
            if (cell) {
                cell.classList.add('valid-summon');
            }
        });
    }

    // カードを使用して駒を召喚
    useCard(x, y) {
        if (!this.selectedCard) return false;
        
        const player = game.board.currentPlayer;
        const success = game.board.summonPiece(this.selectedCard.pieceType, x, y);
        
        if (success) {
            // 手札からカードを削除
            const hand = player === 1 ? this.player1Hand : this.player2Hand;
            const index = hand.findIndex(card => card.id === this.selectedCard.id);
            if (index !== -1) {
                hand.splice(index, 1);
            }
            
            // アクション実行済みとしてマーク
            if (game) {
                game.hasPerformedAction = true;
                game.updateActionModeUI();
            }
            
            // 選択をクリア
            this.clearCardSelection();
            
            // 手札を再描画
            this.renderHands();
            
            return true;
        }
        
        return false;
    }

    // カードの選択をクリア
    clearCardSelection() {
        this.selectedCard = null;
        document.querySelectorAll('.card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelectorAll('.cell.valid-summon').forEach(cell => {
            cell.classList.remove('valid-summon');
        });
    }

    // ターン開始時の処理
    startTurn(player) {
        // カードをドロー
        const drawnCard = this.drawCard(player);
        if (drawnCard) {
            this.renderHands();
        }
    }
}