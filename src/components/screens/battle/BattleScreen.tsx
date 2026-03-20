import { useState, useCallback } from 'react';
import { useBattleStore } from '../../../store/useBattleStore';
import { Numpad } from '../../ui/Numpad';
import { shapeEmoji } from '../../../lib/dragonGenerator';

function HpBar({ hp, maxHp, name, color }: { hp: number; maxHp: number; name: string; color: string }) {
  const pct = maxHp > 0 ? hp / maxHp : 0;
  const barColor = pct > 0.5 ? 'bg-emerald-500' : pct > 0.25 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold" style={{ color }}>{name}</span>
        <span className="text-xs text-purple-300">{hp}/{maxHp}</span>
      </div>
      <div className="h-3 bg-purple-900 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

type SelectedDragon = NonNullable<ReturnType<typeof useBattleStore.getState>['p1']['selectedDragon']>;

function DragonDisplay({ dragon, hp, maxHp, isActive }: {
  dragon: SelectedDragon;
  hp: number; maxHp: number; isActive: boolean;
}) {
  return (
    <div className={`rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition-all ${isActive ? 'ring-2 ring-amber-400' : 'opacity-70'}`}
      style={{ backgroundColor: dragon.colorBg, borderColor: dragon.colorBorder }}>
      <div className="text-4xl">{shapeEmoji(dragon.shape)}</div>
      <div className="text-white font-bold text-sm text-center">{dragon.name}</div>
      <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${hp / maxHp > 0.5 ? 'bg-emerald-400' : hp / maxHp > 0.25 ? 'bg-amber-400' : 'bg-red-400'}`}
          style={{ width: `${(hp / maxHp) * 100}%` }} />
      </div>
      <div className="text-white text-xs">{hp}/{maxHp} HP</div>
    </div>
  );
}

export function BattleScreen() {
  const p1 = useBattleStore(s => s.p1);
  const p2 = useBattleStore(s => s.p2);
  const p1Hp = useBattleStore(s => s.p1Hp);
  const p2Hp = useBattleStore(s => s.p2Hp);
  const p1MaxHp = useBattleStore(s => s.p1MaxHp);
  const p2MaxHp = useBattleStore(s => s.p2MaxHp);
  const currentTurn = useBattleStore(s => s.currentTurn);
  const battleProblem = useBattleStore(s => s.battleProblem);
  const awaitingAction = useBattleStore(s => s.awaitingAction);
  const submitBattleAnswer = useBattleStore(s => s.submitBattleAnswer);
  const performAction = useBattleStore(s => s.performAction);

  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const currentPlayer = currentTurn === 1 ? p1 : p2;
  const p1Dragon = p1.selectedDragon;
  const p2Dragon = p2.selectedDragon;

  const handleSubmit = useCallback(() => {
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed) || animating) return;
    setInputValue('');
    const correct = submitBattleAnswer(parsed);
    if (!correct) {
      setFeedback('✗ Wrong! −2 HP');
      setShake(true);
      setAnimating(true);
      setTimeout(() => {
        setFeedback(null);
        setShake(false);
        setAnimating(false);
        setShowPass(true);
      }, 1000);
    }
    // if correct, awaitingAction becomes true via store — no extra state needed
  }, [inputValue, animating, submitBattleAnswer]);

  const handleAction = (action: 'attack' | 'heal') => {
    const attacker = currentTurn === 1 ? p1 : p2;
    const power = attacker.selectedDragon?.power ?? 1;
    const msg = action === 'attack'
      ? `⚔️ Attack! −${power} HP to opponent`
      : '❤️ Heal! +5 HP restored';
    setFeedback(msg);
    setAnimating(true);
    performAction(action);
    setTimeout(() => {
      setFeedback(null);
      setAnimating(false);
      setShowPass(true);
    }, 1200);
  };

  const handlePassConfirm = () => {
    setShowPass(false);
    setInputValue('');
  };

  const nextPlayer = currentTurn === 1 ? p2 : p1;

  // Pass device overlay
  if (showPass) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-indigo-950 to-gray-950 flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-6xl">📱</div>
        <h2 className="text-2xl font-extrabold text-white text-center">Pass to {nextPlayer.name}!</h2>
        <p className="text-purple-400 text-center">Don't peek at the screen while passing!</p>
        <button
          onClick={handlePassConfirm}
          className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold py-4 px-10 rounded-2xl text-xl shadow-lg shadow-amber-900/30"
        >
          I'm ready, {nextPlayer.name}! →
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-indigo-950 to-gray-950 flex flex-col p-4 gap-3 max-w-lg mx-auto">
      {/* Turn indicator */}
      <div className="text-center">
        <span className="bg-amber-600 text-white font-bold px-4 py-1.5 rounded-full text-sm">
          {currentPlayer.name}'s Turn
        </span>
      </div>

      {/* Dragon arena */}
      {p1Dragon && p2Dragon && (
        <div className="flex gap-3">
          <DragonDisplay dragon={p1Dragon} hp={p1Hp} maxHp={p1MaxHp} isActive={currentTurn === 1} />
          <div className="flex flex-col items-center justify-center text-purple-600 font-extrabold text-lg">VS</div>
          <DragonDisplay dragon={p2Dragon} hp={p2Hp} maxHp={p2MaxHp} isActive={currentTurn === 2} />
        </div>
      )}

      {/* Problem panel */}
      <div className="bg-purple-900/40 border border-purple-700/50 rounded-2xl p-4 text-center">
        <div className="text-purple-400 text-xs mb-1">Answer correctly to act!</div>
        <div className="text-white text-3xl font-extrabold font-mono">
          {battleProblem?.expression ?? '...'} = ?
        </div>
        {feedback && (
          <div className={`mt-2 text-sm font-bold ${feedback.includes('✗') ? 'text-red-400' : 'text-emerald-400'}`}>
            {feedback}
          </div>
        )}
      </div>

      {/* Action area */}
      {awaitingAction ? (
        <div className="flex flex-col gap-3">
          <div className="text-center text-emerald-400 font-bold text-sm">✓ Correct! Choose your action:</div>
          <div className="flex gap-3">
            <button
              onClick={() => handleAction('attack')}
              disabled={animating}
              className="flex-1 bg-red-700/80 hover:bg-red-600/80 border border-red-600/50 text-white font-bold py-5 rounded-2xl text-lg transition-colors disabled:opacity-40"
            >
              ⚔️ Attack<br />
              <span className="text-red-300 text-sm font-normal">
                -{(currentTurn === 1 ? p1 : p2).selectedDragon?.power ?? 0} HP
              </span>
            </button>
            <button
              onClick={() => handleAction('heal')}
              disabled={animating}
              className="flex-1 bg-emerald-800/80 hover:bg-emerald-700/80 border border-emerald-600/50 text-white font-bold py-5 rounded-2xl text-lg transition-colors disabled:opacity-40"
            >
              ❤️ Heal<br />
              <span className="text-emerald-300 text-sm font-normal">+5 HP</span>
            </button>
          </div>
        </div>
      ) : (
        <Numpad
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          disabled={animating}
          submitLabel="⚔️ Answer"
          shake={shake}
        />
      )}
    </div>
  );
}

// Suppress unused import warning for HpBar
void HpBar;
