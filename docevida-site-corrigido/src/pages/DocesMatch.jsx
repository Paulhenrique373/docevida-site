import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Award, Coins, Heart, RotateCcw, ShoppingBag, Sparkles, Trophy, Zap } from "lucide-react";
import "./DocesMatch.css";

const STORAGE_KEY = "docevida-doces-match-v1";
const CANDIES = [
  { id: "morango", emoji: "🍓", name: "Moranguinho" },
  { id: "doce", emoji: "🍬", name: "Bala" },
  { id: "cupcake", emoji: "🧁", name: "Cupcake" },
  { id: "cookie", emoji: "🍪", name: "Cookie" },
  { id: "donut", emoji: "🍩", name: "Rosquinha" },
  { id: "choco", emoji: "🍫", name: "Chocolate" },
];
const SHOP = [
  { id: "extraMoves", name: "+3 movimentos", description: "Mais chances para concluir uma fase.", cost: 80, icon: "👟", type: "consumable" },
  { id: "rainbow", name: "Doce arco-íris", description: "Remove todos os doces de um tipo na próxima jogada.", cost: 120, icon: "🌈", type: "consumable" },
  { id: "themeNight", name: "Tema noite retrô", description: "Desbloqueia uma aparência noturna para o tabuleiro.", cost: 180, icon: "🌙", type: "theme" },
];
const ACHIEVEMENTS = [
  { id: "firstMatch", title: "Primeira combinação", detail: "Faça sua primeira combinação.", icon: "🍭" },
  { id: "score500", title: "Docinho de ouro", detail: "Marque 500 pontos em uma fase.", icon: "⭐" },
  { id: "level3", title: "Mestre confeiteiro", detail: "Chegue à fase 3.", icon: "👑" },
  { id: "rich", title: "Cofrinho cheio", detail: "Junte 250 moedas ao longo do jogo.", icon: "🪙" },
  { id: "combo", title: "Combo delicioso", detail: "Combine 5 ou mais doces de uma vez.", icon: "💥" },
];

function randomCandy() { return Math.floor(Math.random() * CANDIES.length); }
function makeBoard() {
  const board = Array.from({ length: 64 }, () => randomCandy());
  // Evita combinações automáticas no início da partida.
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const i = r * 8 + c;
    while ((c >= 2 && board[i] === board[i - 1] && board[i] === board[i - 2]) ||
      (r >= 2 && board[i] === board[i - 8] && board[i] === board[i - 16])) board[i] = randomCandy();
  }
  return board;
}
function findMatches(board) {
  const found = new Set();
  for (let r = 0; r < 8; r++) {
    let start = 0;
    while (start < 8) {
      const value = board[r * 8 + start]; let end = start + 1;
      while (end < 8 && board[r * 8 + end] === value) end++;
      if (value !== null && end - start >= 3) for (let c = start; c < end; c++) found.add(r * 8 + c);
      start = end;
    }
  }
  for (let c = 0; c < 8; c++) {
    let start = 0;
    while (start < 8) {
      const value = board[start * 8 + c]; let end = start + 1;
      while (end < 8 && board[end * 8 + c] === value) end++;
      if (value !== null && end - start >= 3) for (let r = start; r < end; r++) found.add(r * 8 + c);
      start = end;
    }
  }
  return found;
}
function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return saved && typeof saved === "object" ? saved : {};
  } catch { return {}; }
}

export default function DocesMatch() {
  const saved = useMemo(loadSaved, []);
  const [board, setBoard] = useState(() => makeBoard());
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState(20);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(Math.max(1, Number(saved.level) || 1));
  const [coins, setCoins] = useState(Math.max(0, Number(saved.coins) || 0));
  const [totalCoins, setTotalCoins] = useState(Math.max(0, Number(saved.totalCoins) || 0));
  const [best, setBest] = useState(Math.max(0, Number(saved.best) || 0));
  const [unlocked, setUnlocked] = useState(Array.isArray(saved.unlocked) ? saved.unlocked : []);
  const [inventory, setInventory] = useState(saved.inventory && typeof saved.inventory === "object" ? saved.inventory : {});
  const [owned, setOwned] = useState(Array.isArray(saved.owned) ? saved.owned : []);
  const [activeTab, setActiveTab] = useState("game");
  const [message, setMessage] = useState("Combine 3 doces iguais para marcar pontos!");
  const [busy, setBusy] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [theme, setTheme] = useState(saved.theme === "night" ? "night" : "day");
  const [totalMatches, setTotalMatches] = useState(Number(saved.totalMatches) || 0);

  const goal = 300 + (level - 1) * 180;
  const progress = Math.min(100, Math.round((score / goal) * 100));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ level, coins, totalCoins, best, unlocked, inventory, owned, theme, totalMatches }));
  }, [level, coins, totalCoins, best, unlocked, inventory, owned, theme, totalMatches]);

  const award = useCallback((id) => {
    setUnlocked((current) => current.includes(id) ? current : [...current, id]);
  }, []);

  const startLevel = useCallback((nextLevel = level) => {
    setBoard(makeBoard()); setSelected(null); setMoves(20); setScore(0); setGameOver(false); setWon(false); setBusy(false);
    setLevel(nextLevel); setMessage(`Fase ${nextLevel}: alcance ${300 + (nextLevel - 1) * 180} pontos!`);
  }, [level]);

  const finishIfNeeded = useCallback((newScore, remainingMoves) => {
    if (newScore >= goal) {
      setWon(true); setGameOver(true); setMessage("Fase concluída! Você é um talento da confeitaria!");
      setBest((b) => Math.max(b, newScore));
      const reward = 30 + level * 10;
      setCoins((c) => c + reward); setTotalCoins((c) => c + reward);
      if (newScore >= 500) award("score500");
      if (level + 1 >= 3) award("level3");
      if (totalCoins + reward >= 250) award("rich");
    } else if (remainingMoves <= 0) {
      setGameOver(true); setMessage("As jogadas acabaram! Tente de novo e alcance a meta.");
      setBest((b) => Math.max(b, newScore));
    }
  }, [award, goal, level, totalCoins]);

  const resolveBoard = useCallback((initialBoard, initialScore, remainingMoves) => {
    let current = [...initialBoard]; let gained = 0; let longest = 0;
    // Resolve cascatas de combinações sem animações longas, para funcionar bem em celular.
    for (let pass = 0; pass < 12; pass++) {
      const matches = findMatches(current);
      if (!matches.size) break;
      longest = Math.max(longest, matches.size);
      gained += matches.size * 10;
      matches.forEach((index) => { current[index] = null; });
      for (let c = 0; c < 8; c++) {
        const remaining = [];
        for (let r = 7; r >= 0; r--) if (current[r * 8 + c] !== null) remaining.push(current[r * 8 + c]);
        for (let r = 7; r >= 0; r--) current[r * 8 + c] = remaining[7 - r] ?? randomCandy();
      }
    }
    if (gained === 0) return false;
    const newScore = initialScore + gained;
    const earned = Math.floor(gained / 100);
    setBoard(current); setScore(newScore); setCoins((c) => c + earned); setTotalCoins((c) => c + earned);
    setTotalMatches((m) => m + 1); award("firstMatch");
    if (longest >= 5) award("combo");
    setMessage(`Delícia! +${gained} pontos${earned ? ` e ${earned} moeda${earned > 1 ? "s" : ""}` : ""}.`);
    finishIfNeeded(newScore, remainingMoves);
    return true;
  }, [award, finishIfNeeded]);

  const handleTile = (index) => {
    if (busy || gameOver) return;
    if (selected === null) { setSelected(index); return; }
    if (selected === index) { setSelected(null); return; }
    const r1 = Math.floor(selected / 8), c1 = selected % 8, r2 = Math.floor(index / 8), c2 = index % 8;
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) { setSelected(index); return; }
    const next = [...board]; [next[selected], next[index]] = [next[index], next[selected]];
    const matches = findMatches(next);
    if (!matches.size) { setSelected(null); setMessage("Essa troca não formou combinação. Tente outra!"); return; }
    const remaining = moves - 1;
    setBusy(true); setSelected(null); setMoves(remaining);
    resolveBoard(next, score, remaining);
    window.setTimeout(() => setBusy(false), 120);
  };

  const buyItem = (item) => {
    if (item.type === "theme" && owned.includes(item.id)) { setTheme("night"); setMessage("Tema noite retrô ativado!"); return; }
    if (coins < item.cost) { setMessage("Você ainda não tem moedas suficientes."); return; }
    setCoins((c) => c - item.cost);
    if (item.type === "theme") { setOwned((o) => [...o, item.id]); setTheme("night"); }
    else setInventory((i) => ({ ...i, [item.id]: (i[item.id] || 0) + 1 }));
    setMessage(`${item.name} comprado!`);
  };

  const usePower = (id) => {
    if (!inventory[id] || gameOver || busy) return;
    if (id === "extraMoves") { setMoves((m) => m + 3); setInventory((i) => ({ ...i, extraMoves: i.extraMoves - 1 })); setMessage("+3 movimentos adicionados!"); }
    if (id === "rainbow") {
      const counts = CANDIES.map((_, candyId) => ({ candyId, count: board.filter((v) => v === candyId).length })).sort((a, b) => b.count - a.count);
      const removeId = counts[0].candyId; const next = board.map((v) => v === removeId ? null : v);
      for (let c = 0; c < 8; c++) { const rem = []; for (let r = 7; r >= 0; r--) if (next[r * 8 + c] !== null) rem.push(next[r * 8 + c]); for (let r = 7; r >= 0; r--) next[r * 8 + c] = rem[7 - r] ?? randomCandy(); }
      const gained = counts[0].count * 10; const newScore = score + gained; const remaining = moves - 1;
      setMoves(remaining); setScore(newScore); setBoard(next); setInventory((i) => ({ ...i, rainbow: i.rainbow - 1 })); setMessage(`Arco-íris! +${gained} pontos.`); finishIfNeeded(newScore, remaining);
    }
  };

  return (
    <div className={`dm-page ${theme === "night" ? "dm-night" : ""}`}>
      <div className="dm-shell">
        <Link to="/" className="dm-back"><ArrowLeft size={16} /> Voltar para a DoceVida</Link>
        <header className="dm-hero">
          <div className="dm-pixel-stamp">★ ARCADE DE DOCES ★</div>
          <div className="dm-logo-row"><span className="dm-big-candy">🍓</span><div><p className="dm-kicker">DOCEVIDA APRESENTA</p><h1>DOCES <span>MATCH</span></h1><p className="dm-subtitle">Uma aventura açucarada em pixels!</p></div><span className="dm-big-candy">🍬</span></div>
          <div className="dm-stats">
            <div><Coins size={17}/><span><small>MOEDAS</small><strong>{coins}</strong></span></div>
            <div><Trophy size={17}/><span><small>RECORDE</small><strong>{best}</strong></span></div>
            <div><Sparkles size={17}/><span><small>FASE</small><strong>{level}</strong></span></div>
          </div>
        </header>

        <nav className="dm-tabs" aria-label="Menu do jogo">
          <button className={activeTab === "game" ? "active" : ""} onClick={() => setActiveTab("game")}><Zap size={16}/> JOGAR</button>
          <button className={activeTab === "shop" ? "active" : ""} onClick={() => setActiveTab("shop")}><ShoppingBag size={16}/> LOJINHA</button>
          <button className={activeTab === "achievements" ? "active" : ""} onClick={() => setActiveTab("achievements")}><Award size={16}/> CONQUISTAS <span className="dm-tab-count">{unlocked.length}/{ACHIEVEMENTS.length}</span></button>
        </nav>

        {activeTab === "game" && <section className="dm-game-layout">
          <div className="dm-play-area">
            <div className="dm-level-row"><div><span className="dm-mini-label">FASE {level}</span><h2>{level === 1 ? "Primeiros docinhos" : level < 4 ? "Desafio confeiteiro" : "Lenda da doceria"}</h2></div><button className="dm-icon-btn" onClick={() => startLevel(level)} aria-label="Reiniciar fase"><RotateCcw size={18}/></button></div>
            <div className="dm-progress"><div style={{ width: `${progress}%` }}/></div>
            <div className="dm-goal-line"><span>Meta: <b>{goal} pontos</b></span><span>{score} / {goal}</span></div>
            <div className="dm-board" role="group" aria-label="Tabuleiro de combinar doces">
              {board.map((candy, index) => <button key={index} className={`dm-tile ${selected === index ? "selected" : ""}`} onClick={() => handleTile(index)} aria-label={`Casa ${index + 1}: ${CANDIES[candy]?.name || "doce"}`} disabled={busy || gameOver}>
                <span>{CANDIES[candy]?.emoji || "🍬"}</span>
              </button>)}
            </div>
            <div className="dm-message" role="status">{message}</div>
            <div className="dm-game-bottom"><div className="dm-moves"><Heart size={17}/><span><small>JOGADAS</small><strong>{moves}</strong></span></div><div className="dm-powerups">
              <button disabled={!inventory.extraMoves || gameOver} onClick={() => usePower("extraMoves")} title="Usar +3 movimentos">👟 <span>+3</span><i>{inventory.extraMoves || 0}</i></button>
              <button disabled={!inventory.rainbow || gameOver} onClick={() => usePower("rainbow")} title="Usar doce arco-íris">🌈 <i>{inventory.rainbow || 0}</i></button>
            </div></div>
            {gameOver && <div className="dm-end-card"><div className="dm-end-emoji">{won ? "🏆" : "🍪"}</div><h3>{won ? "Fase concluída!" : "Fim de jogo!"}</h3><p>{won ? `Você ganhou ${30 + level * 10} moedas de bônus.` : "Quase lá! Tente outra vez."}</p><button className="dm-primary" onClick={() => startLevel(won ? level + 1 : level)}>{won ? "PRÓXIMA FASE" : "TENTAR NOVAMENTE"} →</button></div>}
          </div>
          <aside className="dm-side-panel"><div className="dm-side-card"><span className="dm-side-icon">🎯</span><h3>COMO JOGAR</h3><ol><li>Toque em um doce.</li><li>Toque em um doce vizinho para trocar.</li><li>Combine 3 ou mais iguais.</li><li>Alcance a meta antes das jogadas acabarem!</li></ol></div><div className="dm-side-card dm-side-highlight"><span className="dm-side-icon">🪙</span><h3>DOCE ECONOMIA</h3><p>Ganhe moedas combinando doces e conclua fases para receber bônus.</p><button className="dm-secondary" onClick={() => setActiveTab("shop")}>VISITAR LOJINHA</button></div><div className="dm-side-card"><span className="dm-side-icon">🎒</span><h3>SEUS PODERES</h3><p>Movimentos extras: <b>{inventory.extraMoves || 0}</b></p><p>Doces arco-íris: <b>{inventory.rainbow || 0}</b></p></div></aside>
        </section>}

        {activeTab === "shop" && <section className="dm-content-panel"><div className="dm-section-heading"><span className="dm-side-icon">🛍️</span><div><p className="dm-kicker">TROQUE SUAS MOEDAS</p><h2>Lojinha pixel</h2><p>Pequenos poderes para uma grande aventura.</p></div><div className="dm-wallet"><Coins size={18}/>{coins}</div></div><div className="dm-shop-grid">{SHOP.map((item) => { const isOwned = owned.includes(item.id); return <article className="dm-shop-item" key={item.id}><div className="dm-shop-art">{item.icon}</div><h3>{item.name}</h3><p>{item.description}</p><div className="dm-shop-footer"><span><Coins size={15}/>{item.cost}</span><button className="dm-primary" disabled={item.type === "theme" && isOwned && theme === "night"} onClick={() => buyItem(item)}>{item.type === "theme" && isOwned ? (theme === "night" ? "EQUIPADO" : "EQUIPAR") : "COMPRAR"}</button></div></article>; })}</div><button className="dm-secondary dm-reset-theme" onClick={() => { setTheme("day"); setMessage("Tema clássico ativado!"); }}>VOLTAR AO TEMA CLÁSSICO</button></section>}

        {activeTab === "achievements" && <section className="dm-content-panel"><div className="dm-section-heading"><span className="dm-side-icon">🏆</span><div><p className="dm-kicker">CADA DOCE CONTA</p><h2>Conquistas</h2><p>Complete desafios para se tornar uma lenda da doceria.</p></div></div><div className="dm-achievement-grid">{ACHIEVEMENTS.map((item) => { const done = unlocked.includes(item.id); return <article key={item.id} className={`dm-achievement ${done ? "done" : ""}`}><div className="dm-achievement-icon">{done ? item.icon : "🔒"}</div><div><h3>{item.title}</h3><p>{item.detail}</p><span>{done ? "✓ CONQUISTADA" : "AINDA NÃO CONQUISTADA"}</span></div></article>; })}</div><div className="dm-total-stats"><div><strong>{totalMatches}</strong><span>combinações feitas</span></div><div><strong>{totalCoins}</strong><span>moedas conquistadas</span></div><div><strong>{unlocked.length}/{ACHIEVEMENTS.length}</strong><span>conquistas</span></div></div></section>}
        <footer className="dm-footer"><span>♥ FEITO COM AÇÚCAR E PIXELS ♥</span><p>Doces Match · Um joguinho da DoceVida</p><button onClick={() => { if (window.confirm("Isso apagará o progresso salvo deste jogo neste dispositivo. Continuar?")) { localStorage.removeItem(STORAGE_KEY); window.location.reload(); } }}>REINICIAR TODO O PROGRESSO</button></footer>
      </div>
    </div>
  );
}
