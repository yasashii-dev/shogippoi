// メインエントリーポイント

document.addEventListener('DOMContentLoaded', () => {
    // ゲームインスタンスを作成
    game = new Game();
    
    // 開始演出
    setTimeout(() => {
        document.querySelector('.start-content').style.animation = 'slideDown 0.8s ease-out forwards';
    }, 100);
    
    // スタート画面のイベントリスナー
    document.getElementById('pvp-btn').addEventListener('click', () => {
        // フェードアウトアニメーション
        const startScreen = document.getElementById('start-screen');
        startScreen.style.animation = 'fadeOut 0.5s ease-out forwards';
        setTimeout(() => {
            game.setGameMode('pvp');
        }, 500);
    });
    
    document.getElementById('pve-btn').addEventListener('click', () => {
        document.getElementById('ai-difficulty').classList.remove('hidden');
        document.getElementById('ai-difficulty').style.animation = 'fadeInButtons 0.5s ease-out';
    });
    
    // AI難易度選択
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const difficulty = e.target.dataset.level;
            const startScreen = document.getElementById('start-screen');
            startScreen.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                game.setGameMode('pve', difficulty);
            }, 500);
        });
    });
});