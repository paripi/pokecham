import React, { useState } from 'react';
import { POKEMON_DB, MOVE_DB, hiraToKata } from './pokemonData';

// Appコンポーネント
function App() {
  const [view, setView] = useState('selection'); // 初期表示は選出画面
  const initialPoke = { name: "未入力", s: 0, ts: 0, type: "", moves: ["", "", "", ""] };

  // 自分側のパーティ（登録画面で編集）
  const [myParty, setMyParty] = useState(Array(6).fill(initialPoke));
  // 相手側のパーティ（選出画面で編集）
  const [enemyParty, setEnemyParty] = useState(Array(6).fill(initialPoke));
  
  // どちらを編集しているか管理 { type: 'my' | 'enemy', index: 0~5 }
  const [editConfig, setEditConfig] = useState(null);

  // 技を更新するための関数を追加
  const handleUpdateMove = (pokeIndex, moveIndex, moveName) => {
    const newParty = [...myParty];
    // 技配列だけを新しくして更新
    const newMoves = [...newParty[pokeIndex].moves];
    newMoves[moveIndex] = moveName;
    newParty[pokeIndex] = { ...newParty[pokeIndex], moves: newMoves };
    setMyParty(newParty);
  };
  
  // 技を選択した時の処理
  const handleSelectMove = (move) => {
    if (!editConfig || editConfig.moveIndex === null) return;
  
    const { pokeIndex, moveIndex } = editConfig;
    const newParty = [...myParty];
    const newMoves = [...newParty[pokeIndex].moves];
    newMoves[moveIndex] = move.name; // 技名をセット
    newParty[pokeIndex] = { ...newParty[pokeIndex], moves: newMoves };
    setMyParty(newParty);
    setEditConfig(null); // モーダルを閉じる
  };

  // ポケモンが選択された時の処理
  const handleSelectPokemon = (poke) => {
    if (!editConfig) return;
    
    // 選択したポケモンのデータをベースに、必ず moves を付与する
    const newPokeData = {
      ...poke,
      moves: poke.moves || ["", "", "", ""] // 技枠がなければ初期化
    };

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
        {/* 1. 登録画面 */}
        {view === 'register' && (
          <RegisterView 
            myParty={myParty} 
            onMyPokeClick={(index) => setEditConfig({ type: 'my', index })} 
            onMoveClick={(pokeIndex, moveIndex) => setEditConfig({ type: 'my', pokeIndex, moveIndex })}
          />
        )}
        
        {/* 2. 選出画面 */}
        {view === 'selection' && (
          <SelectionMatrix 
            myParty={myParty} 
            enemyParty={enemyParty} 
            onEnemyClick={(index) => setEditConfig({ type: 'enemy', index })} 
          />
        )}

        {/* 3. 計算画面（仮） */}
        {view === 'calc' && <CalcView />}
      </main>

      {/* 検索モーダル */}
      {editConfig !== null && (
        <SearchModal 
          // editConfig に moveIndex があれば 'move'、なければ 'pokemon'
          mode={editConfig.moveIndex !== undefined ? 'move' : 'pokemon'}
          onClose={() => setEditConfig(null)} 
          onSelect={editConfig.moveIndex !== undefined ? handleSelectMove : handleSelectPokemon} 
        />
      )}
    </div>
  );
}

// --- 登録画面コンポーネント ---
function RegisterView({ myParty, onMyPokeClick, onMoveClick }) {
return (
    <div style={{ padding: '10px' }}>
      <h3 style={{ fontSize: '1rem', borderLeft: '4px solid #3182ce', paddingLeft: '10px', marginBottom: '15px' }}>🛡️ マイパーティ登録</h3>
      {myParty.map((p, i) => (
        <div key={i} style={registerCardStyle}>
          {/* ポケモン選択部分 */}
          <div onClick={() => onMyPokeClick(i)} style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '8px', marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: p.name === "未入力" ? "#a0aec0" : "#2d3748" }}>
              {i + 1}. {p.name}
            </div>
            {p.name !== "未入力" && (
              <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                S:{p.s} / {p.type}
              </div>
            )}
          </div>

          {/* 技入力部分（4つ） */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            {(p.moves || []).map((move, moveIdx) => (
              <div 
                key={moveIdx} 
                onClick={() => onMoveClick(i, moveIdx)}
                style={{
                  ...moveButtonStyle,
                  // 未入力の時は薄い色にする
                  backgroundColor: p.name === "未入力" ? "#edf2f7" : "#f7fafc"
                }}
              >
                {move || <span style={{ color: '#cbd5e0' }}>技{moveIdx + 1}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// 追加するスタイル
const moveInputStyle = {
  padding: '6px',
  fontSize: '0.75rem',
  border: '1px solid #e2e8f0',
  borderRadius: '4px',
  outline: 'none',
  backgroundColor: '#f8fafc'
};

// --- 選出マトリックスコンポーネント ---
function SelectionMatrix({ myParty, enemyParty, onEnemyClick }) {
  return (
    <div style={matrixWrapperStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={headerCellStyle}>
              <div style={innerHeaderStyle}>自分 \ 相手</div>
            </th>
            {enemyParty.map((p, i) => (
              <th key={i} onClick={() => onEnemyClick(i)} style={enemyHeaderStyle}>
                <div style={innerHeaderStyle}>
                  <div style={{...headerTextStyle, color: '#e53e3e'}}>{p.name}</div>
                  <div>
                    <div style={{...infoTextStyle, color: '#e53e3e'}}>{p.ts > 0 ? `ts:${p.ts}` : '-'}</div>
                    <div style={{...infoTextStyle, color: '#e53e3e'}}>{p.type || '-'}</div>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {myParty.map((myPoke, i) => (
            <tr key={i}>
              <td style={myHeaderStyle}>
                <div style={innerHeaderStyle}>
                  <div style={{...headerTextStyle, color: '#3182ce'}}>{myPoke.name}</div>
                  <div>
                    <div style={infoTextStyle}>{myPoke.ts > 0 ? `ts:${myPoke.ts}` : '-'}</div>
                    <div style={infoTextStyle}>{myPoke.type || '-'}</div>
                  </div>
                </div>
              </td>
              {enemyParty.map((enPoke, j) => (
                <td key={j} style={cellStyle}>
                  {enPoke.ts > 0 && myPoke.ts > 0 && (myPoke.ts > enPoke.ts ? "🚀" : "🐢")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CalcView() {
  return <div style={{ padding: '20px', textAlign: 'center', color: '#718096' }}>📊 ダメージ計算（開発中）</div>;
}

// --- 検索モーダルコンポーネント ---
function SearchModal({ onClose, onSelect, mode }) {
  // 勝手にスクロールされないように
  React.useEffect(() => {
    // 1. スクロール禁止（既存の処理）
    document.body.style.overflow = 'hidden';

    // 2. キーボード出現時の高さズレ対策（重要）
    const handler = () => {
      if (window.visualViewport) {
        // モーダルをキーボードの上部に張り付かせるなどの調整が可能
        // ここで modalContentStyle の top を visualViewport.offsetTop に合わせる等
      }
    };
    window.visualViewport?.addEventListener('resize', handler);

    return () => {
      document.body.style.overflow = 'unset';
      window.visualViewport?.removeEventListener('resize', handler);
    };
  }, []);
  
  const [query, setQuery] = useState('');
  const normalize = (str) => {
      if (!str) return "";
      return hiraToKata(str)                // 1. ひらがなをカタカナに
        .toLowerCase()                      // 2. アルファベットを小文字に
        .replace(/[・\s　]/g, "")           // 3. 中黒、スペース（全角・半角）を除去
        .replace(/[ぁ-ん]/g, m => String.fromCharCode(m.charCodeAt(0) + 0x60)); // 念のためカタカナに
    };
  
  const data = mode === 'move' ? MOVE_DB : POKEMON_DB;
  // 常に8件分くらいのスペースを確保するためのリスト作成
  const results = data.filter(item => normalize(item.name).includes(normalize(query)));
  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <input 
          autoFocus 
          placeholder={`${mode === 'move' ? '技' : 'ポケモン'}名で検索...`} 
          onChange={(e) => setQuery(e.target.value)} 
          style={inputStyle} 
        />
        
        {/* 結果エリア：ここを固定サイズにする */}
        <div style={resultContainerStyle}>
          {results.length > 0 ? (
            results.map(item => (
              <div key={item.name} onClick={() => onSelect(item)} style={resultItemStyle}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{item.name}</div>
                {/* 技の場合の追加情報 (v-if) */}
                    {mode === 'move' && (
                      <div style={{ fontSize: '0.7rem', color: '#888' }}>
                        {item.type} / {item.category} / 威:{item.power}
                      </div>
                    )}
            
                {/* ポケモンの場合の追加情報 (v-else相当) */}
                {mode !== 'move' && (
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>
                    S:{item.s} / {item.type}
                  </div>
                )}
              </div>
            ))
          ) : (
            // 検索結果がない時も高さを維持するためのダミーメッセージ
            <div style={noResultStyle}>一致するデータがありません</div>
          )}
        </div>

        <button onClick={onClose} style={closeBtnStyle}>閉じる</button>
      </div>
    </div>
  );
}

const modalOverlayStyle = { 
  position: 'fixed', 
  top: 0, 
  left: 0, 
  width: '100%',
  height: '100dvh', // キーボード分を差し引いた高さを自動計算してくれる
  backgroundColor: 'rgba(0,0,0,0.6)', 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'flex-start',
  paddingTop: '20px', 
  zIndex: 9999, // 最前面へ
  overflow: 'hidden' // ここで背後のスクロールを完全に殺す
};

const modalContentStyle = { 
  backgroundColor: '#fff', 
  padding: '20px', 
  borderRadius: '15px', 
  width: '90%', 
  maxWidth: '400px',
  maxHeight: '90vh',      // 画面の90%を超えない
  height: 'auto',         // 内容量に応じて高さが変わる
  minHeight: '200px',     // 最低でもこれくらいは確保
  display: 'flex', 
  flexDirection: 'column',
  position: 'fixed',      // 画面に対して固定
  top: '5%',              // 上からの位置を固定
  left: '50%',            // 画面の真ん中に持ってくる
  transform: 'translateX(-50%)' // 真ん中に配置するテクニック
};

const resultContainerStyle = { 
  marginTop: '10px', 
  flex: 1,           // 空きスペースをすべて使う
  overflowY: 'auto', // ここでスクロールさせる
  border: '1px solid #edf2f7',
  borderRadius: '8px',
  backgroundColor: '#fdfdfd',
  minHeight: '100px' // 最低限の高さは確保
};

const noResultStyle = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.8rem',
  color: '#a0aec0'
};

const resultItemStyle = { 
  height: '50px', // 各アイテムの高さを固定
  padding: '8px 12px', 
  borderBottom: '1px solid #edf2f7', 
  cursor: 'pointer',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
};

// --- スタイル定義（既存の設定を継承） ---
const tableWidth = 'clamp(400px, calc(100vw - 32px), 800px)';
const cellWidth = `calc(${tableWidth} / 7)`;
const headerHeight = '95px';

const containerStyle = { width: '100vw', maxWidth: '100vw', margin: '0 auto', backgroundColor: '#f7fafc', minHeight: '100vh', overflowX: 'hidden' };
const navStyle = { display: 'flex', backgroundColor: '#2d3748', position: 'sticky', top: 0, zIndex: 10 };
const tabStyle = { flex: 1, padding: '15px', color: '#a0aec0', background: 'none', border: 'none', fontSize: '0.9rem', cursor: 'pointer' };
const activeTabStyle = { ...tabStyle, color: '#fff', fontWeight: 'bold', borderBottom: '3px solid #3182ce' };

const matrixWrapperStyle = { overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '10px 0' };
const tableStyle = { borderCollapse: 'collapse', tableLayout: 'fixed', width: tableWidth, margin: '0 auto' };

const headerCellStyle = { width: cellWidth, height: headerHeight, border: '1px solid #e2e8f0', backgroundColor: '#edf2f7', padding: 0 };
const myHeaderStyle = { ...headerCellStyle, backgroundColor: '#ebf8ff' };
const enemyHeaderStyle = { ...headerCellStyle, backgroundColor: '#fff5f5', cursor: 'pointer' };

const innerHeaderStyle = {
  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
  height: '100%', padding: '6px 2px', boxSizing: 'border-box', textAlign: 'center'
};

const headerTextStyle = {
  fontSize: '0.65rem', lineHeight: '1.2', fontWeight: 'bold',
  display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3,
  overflow: 'hidden', wordBreak: 'break-all'
};

const infoTextStyle = { fontSize: '0.55rem', fontWeight: 'normal', lineHeight: '1.1' };
const cellStyle = { width: cellWidth, height: '55px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '1.2rem', backgroundColor: '#fff' };

const moveButtonStyle = {
  backgroundColor: '#f7fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '4px',
  padding: '8px',
  textAlign: 'center',
  fontSize: '0.75rem',
  cursor: 'pointer',
  minHeight: '30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#4a5568'
};

const registerCardStyle = { backgroundColor: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' };
const inputStyle = { 
  width: '100%', 
  padding: '12px', 
  borderRadius: '10px', 
  border: '2px solid #3182ce', 
  boxSizing: 'border-box',
  fontSize: '16px', // ここを16px以上に設定
  outline: 'none',
  // スマホで入力しやすいように少し高さを出す
  height: '48px' 
};
const closeBtnStyle = { width: '100%', marginTop: '15px', padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: '#718096', color: '#fff' };

export default App;