// メインエントリーポイント

document.addEventListener('DOMContentLoaded', () => {
    // ゲームインスタンスを作成
    game = new Game();
    
    // スタート画面のイベントリスナー
    document.getElementById('pvp-btn').addEventListener('click', () => {
        game.setGameMode('pvp');
    });
    
    document.getElementById('pve-btn').addEventListener('click', () => {
        document.getElementById('ai-difficulty').classList.remove('hidden');
    });
    
    // AI難易度選択
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const difficulty = e.target.dataset.level;
            game.setGameMode('pve', difficulty);
        });
    });
});