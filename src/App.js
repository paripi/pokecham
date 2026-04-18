import React, { useState } from 'react';
import { POKEMON_DB, MOVE_DB, hiraToKata } from './pokemonData';

// --- アプリ本体 ---
function App() {
  const [view, setView] = useState('selection');
  const initialPoke = { name: "未入力", s: 0, ts: 0, type: "", moves: ["", "", "", ""] };
  const [myParty, setMyParty] = useState(Array(6).fill(initialPoke));
  const [enemyParty, setEnemyParty] = useState(Array(6).fill(initialPoke));
  const [editConfig, setEditConfig] = useState(null);

  const handleSelectMove = (move) => {
    if (!editConfig) return;
    const { pokeIndex, moveIndex } = editConfig;
    const newParty = [...myParty];
    const newMoves = [...(newParty[pokeIndex].moves || ["", "", "", ""])];
    newMoves[moveIndex] = move.name;
    newParty[pokeIndex] = { ...newParty[pokeIndex], moves: newMoves };
    setMyParty(newParty);
    setEditConfig(null);
  };

  const handleSelectPokemon = (poke) => {
    if (!editConfig) return;
    const newPokeData = { ...poke, moves: poke.moves || ["", "", "", ""] };
    if (editConfig.type === 'my') {
      const newParty = [...myParty];
      newParty[editConfig.index] = newPokeData;
      setMyParty(newParty);
    } else {
      const newParty = [...enemyParty];
      newParty[editConfig.index] = newPokeData;
      setEnemyParty(newParty);
    }
    setEditConfig(null);
  };

  return (
    <div style={containerStyle}>
      <nav style={navStyle}>
        <button onClick={() => setView('register')} style={view === 'register' ? activeTabStyle : tabStyle}>登録</button>
        <button onClick={() => setView('selection')} style={view === 'selection' ? activeTabStyle : tabStyle}>選出</button>
        <button onClick={() => setView('calc')} style={view === 'calc' ? activeTabStyle : tabStyle}>計算</button>
      </nav>

      <main style={{ padding: '10px' }}>
        {view === 'register' && (
          <RegisterView 
            myParty={myParty} 
            onMyPokeClick={(index) => setEditConfig({ type: 'my', index })} 
            onMoveClick={(pokeIndex, moveIndex) => setEditConfig({ type: 'my', pokeIndex, moveIndex })}
          />
        )}
        {view === 'selection' && <SelectionMatrix myParty={myParty} enemyParty={enemyParty} onEnemyClick={(index) => setEditConfig({ type: 'enemy', index })} />}
        {view === 'calc' && <div style={{textAlign: 'center', marginTop: '20px', color: '#718096'}}>📊 ダメージ計算（開発中）</div>}
      </main>

      {editConfig !== null && (
        <SearchModal 
          mode={editConfig.moveIndex !== undefined ? 'move' : 'pokemon'}
          onClose={() => setEditConfig(null)} 
          onSelect={editConfig.moveIndex !== undefined ? handleSelectMove : handleSelectPokemon} 
        />
      )}
    </div>
  );
}

// --- 登録画面（タブ切り替え） ---
function RegisterView({ myParty, onMyPokeClick, onMoveClick }) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div style={{ padding: '10px' }}>
      <h3 style={{ fontSize: '1rem', borderLeft: '4px solid #3182ce', paddingLeft: '10px' }}>🛡️ マイパーティ登録</h3>
      
      {/* 6つのタブ：ポケモン名も表示 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', margin: '15px 0' }}>
        {myParty.map((p, i) => (
          <button 
            key={i} 
            onClick={() => setActiveIdx(i)}
            style={{ 
              padding: '8px 2px', border: 'none', 
              borderRadius: '8px', fontWeight: 'bold', fontSize: '0.75rem',
              backgroundColor: activeIdx === i ? '#3182ce' : '#e2e8f0',
              color: activeIdx === i ? '#fff' : '#4a5568',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}
          >
            {i + 1}. {p.name === "未入力" ? "" : p.name}
          </button>
        ))}
      </div>

      <div style={registerCardStyle}>
        <div onClick={() => onMyPokeClick(activeIdx)} style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '8px', marginBottom: '12px', cursor: 'pointer' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: myParty[activeIdx].name === "未入力" ? "#a0aec0" : "#2d3748" }}>
            {myParty[activeIdx].name}
          </div>
        </div>

        {/* 技を「縦並び」に変更 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(myParty[activeIdx].moves || ["", "", "", ""]).map((move, moveIdx) => (
            <div 
              key={moveIdx} 
              onClick={() => onMoveClick(activeIdx, moveIdx)} 
              style={{ ...moveButtonStyle, height: '20px' }}
            >
              {move || <span style={{ color: '#cbd5e0' }}>技{moveIdx + 1}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- 検索モーダル（スクロール・競り上がり完全対策版） ---
function SearchModal({ onClose, onSelect, mode }) {
  const [modalHeight, setModalHeight] = useState('80vh');
  React.useEffect(() => {
      // 1. 現在のスクロール位置を保存
      const scrollY = window.scrollY;
      
      // 2. bodyに幅を持たせて、スクロールバー消滅によるガタつきを防ぐ
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`; // 現在位置を維持
      document.body.style.left = '0';
      document.body.style.right = '0';
  
      return () => {
        // 3. 解除して元の位置へ戻す
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }, []);

  const [query, setQuery] = useState('');
  const normalize = (str) => (!str ? "" : hiraToKata(str).toLowerCase().replace(/[・\s　]/g, ""));
  const results = (mode === 'move' ? MOVE_DB : POKEMON_DB).filter(item => normalize(item.name).includes(normalize(query)));

  return (
    <div style={modalOverlayStyle}>
      <div style={{ ...modalContentStyle, height: modalHeight }}>
        <input autoFocus placeholder={`${mode === 'move' ? '技' : 'ポケモン'}名検索...`} onChange={(e) => setQuery(e.target.value)} style={inputStyle}
          inputMode="search" // 追加：キーボードの挙動を最適化
          autoComplete="off" // 追加：予測変換によるレイアウト崩れ防止
        />
        <div style={resultContainerStyle}>
          {results.map(item => (
            <div key={item.name} onClick={() => onSelect(item)} style={resultItemStyle}>
              <div style={{ fontWeight: 'bold' }}>{item.name}</div>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={closeBtnStyle}>閉じる</button>
      </div>
    </div>
  );
}

// --- スタイル定義 ---
const modalOverlayStyle = { 
  position: 'fixed', 
  top: 0, 
  left: 0, 
  width: '100%', 
  height: '100%', 
  backgroundColor: 'rgba(0,0,0,0.6)', 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', // 垂直中央に固定
  zIndex: 9999,
  padding: '10px'
};

const modalContentStyle = { 
  backgroundColor: '#fff', 
  padding: '20px', 
  borderRadius: '15px', 
  width: '90%', 
  maxWidth: '400px',
  // 最大高さを画面の70%に制限（キーボード分の余白を確保）
  maxHeight: '70vh', 
  display: 'flex', 
  flexDirection: 'column',
  boxSizing: 'border-box',
  // 画面中央に配置
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)' 
};
const containerStyle = { width: '100vw', margin: '0 auto', backgroundColor: '#f7fafc', minHeight: '100vh', overflowX: 'hidden' };
const navStyle = { display: 'flex', backgroundColor: '#2d3748', position: 'sticky', top: 0, zIndex: 10 };
const tabStyle = { flex: 1, padding: '15px', color: '#a0aec0', background: 'none', border: 'none', fontSize: '0.9rem', cursor: 'pointer' };
const activeTabStyle = { ...tabStyle, color: '#fff', fontWeight: 'bold', borderBottom: '3px solid #3182ce' };
const resultContainerStyle = { marginTop: '10px', flex: 1, overflowY: 'auto', border: '1px solid #edf2f7', borderRadius: '8px', backgroundColor: '#fdfdfd', padding: '5px' };
const resultItemStyle = { height: '55px', padding: '8px', borderBottom: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center' };
const registerCardStyle = { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const moveButtonStyle = { backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', textAlign: 'center', fontSize: '0.85rem', cursor: 'pointer' };
const inputStyle = { width: '100%', padding: '15px', borderRadius: '10px', border: '2px solid #3182ce', fontSize: '16px', boxSizing: 'border-box', height: '50px' };
const closeBtnStyle = { width: '100%', marginTop: '15px', padding: '12px', border: 'none', borderRadius: '8px', backgroundColor: '#718096', color: '#fff', fontWeight: 'bold' };
const matrixWrapperStyle = { overflowX: 'auto', padding: '10px 0' };
const tableStyle = { borderCollapse: 'collapse', tableLayout: 'fixed', width: 'clamp(400px, 95vw, 800px)', margin: '0 auto' };
const headerCellStyle = { fontSize: '0.75rem', width: '15%', height: '95px', border: '1px solid #e2e8f0', backgroundColor: '#edf2f7' };
const myHeaderStyle = { ...headerCellStyle, backgroundColor: '#ebf8ff' };
const enemyHeaderStyle = { ...headerCellStyle, backgroundColor: '#fff5f5', cursor: 'pointer' };
const innerHeaderStyle = { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: '4px', textAlign: 'center', fontSize: '0.6rem' };
const headerTextStyle = { fontWeight: 'bold', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' };
const infoTextStyle = { fontSize: '0.5rem' };
const cellStyle = { width: '15%', height: '55px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '1.2rem', backgroundColor: '#fff' };

function SelectionMatrix({ myParty, enemyParty, onEnemyClick }) {
  return (
    <div style={matrixWrapperStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={headerCellStyle}>自分 \ 相手</th>
            {enemyParty.map((p, i) => (
              <th key={i} onClick={() => onEnemyClick(i)} style={enemyHeaderStyle}>
                <div style={innerHeaderStyle}>
                  {/* 名前 */}
                  <div style={{...headerTextStyle, color: '#e53e3e', fontSize: '0.75rem', marginBottom: '2px'}}>
                    {p.name === "未入力" ? "未選択" : p.name}
                  </div>
                  {/* ts と type を追加 */}
                  {p.name !== "未入力" && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{...infoTextStyle, color: '#e53e3e', fontWeight: 'bold'}}>TS:{p.s}</div>
                      <div style={{...infoTextStyle, color: '#e53e3e' }}>{p.type}</div>
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {myParty.map((myPoke, i) => (
            <tr key={i}>
              {/* 自分側のヘッダーセル */}
              <td style={myHeaderStyle}>
                <div style={innerHeaderStyle}>
                  <div style={{...headerTextStyle, color: '#3182ce', fontSize: '0.6rem'}}>{myPoke.name}</div>
                  
                  {/* 追加：技の表示エリア */}
                  {myPoke.name !== "未入力" && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                      {(myPoke.moves || ["", "", "", ""]).map((move, mIdx) => (
                        <div key={mIdx} style={{ 
                          fontSize: '0.5rem', 
                          color: '#4a5568', 
                          backgroundColor: '#edf2f7', 
                          borderRadius: '2px',
                          padding: '1px 2px',
                          textAlign: 'left',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis'
                        }}>
                          {move || '-'}
                        </div>
                      ))}
                    </div>
                  )}
        
                  <div style={{ marginTop: '4px' }}>
                    <div style={infoTextStyle}>S:{myPoke.s} {myPoke.type}</div>                  </div>
                </div>
              </td>
        
              {/* 対面判定セル */}
              {enemyParty.map((enPoke, j) => (
                <td key={j} style={cellStyle}>
                  {enPoke.s > 0 && myPoke.s > 0 && (myPoke.s > enPoke.s ? "🚀" : "🐢")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;