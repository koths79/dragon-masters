import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { checkAnswer } from '../../lib/puzzleSolver';
import type { PhaserGameRef } from '../../game/PhaserGame';

interface Props {
  dragonRef: React.RefObject<PhaserGameRef | null>;
}

function InfoTooltip({ requireAll }: { requireAll: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(o => !o)}
        className="w-5 h-5 rounded-full bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold flex items-center justify-center leading-none transition-colors"
        aria-label="How to write an equation"
      >
        ?
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-7 w-72 bg-gray-800 border border-gray-600 rounded-xl p-4 shadow-2xl z-10 text-left">
          <div className="text-white font-semibold mb-2 text-sm">How to write an equation</div>
          <ul className="text-gray-300 text-xs space-y-2">
            {requireAll ? (
              <li><span className="text-yellow-400 font-bold">Use ALL numbers</span> — every number shown must appear in your equation exactly once.</li>
            ) : (
              <li><span className="text-yellow-400 font-bold">Choose which numbers to use</span> — you don't have to use all of them, but each one can only be used once.</li>
            )}
            <li><span className="text-yellow-400 font-bold">Put a math sign between numbers</span> — use <code className="bg-gray-700 px-1 rounded">+</code> <code className="bg-gray-700 px-1 rounded">-</code> <code className="bg-gray-700 px-1 rounded">×</code> <code className="bg-gray-700 px-1 rounded">÷</code> between numbers.</li>
            <li><span className="text-yellow-400 font-bold">× and ÷ happen first</span> — (before + and −). Use ( ) to change the order, e.g. <code className="bg-gray-700 px-1 rounded">(3 + 5) × 6</code></li>
            {requireAll && (
              <li><span className="text-yellow-400 font-bold">Parentheses</span> — use <code className="bg-gray-700 px-1 rounded">(</code> <code className="bg-gray-700 px-1 rounded">)</code> to control the order, e.g. <code className="bg-gray-700 px-1 rounded">(3 + 5) × 6</code></li>
            )}
          </ul>
          <div className="mt-3 pt-2 border-t border-gray-700 text-gray-400 text-xs">
            {requireAll
              ? 'Challenge mode: you must use every number!'
              : 'Some extra numbers are shown — you pick which ones to use!'}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-3 h-3 bg-gray-800 border-r border-b border-gray-600 rotate-45" />
        </div>
      )}
    </div>
  );
}

export function PuzzleModal({ dragonRef }: Props) {
  const activePuzzle = useGameStore(s => s.activePuzzle);
  const activeDoorId = useGameStore(s => s.activeDoorId);
  const rooms = useGameStore(s => s.rooms);
  const charms = useGameStore(s => s.charms);
  const submitAnswer = useGameStore(s => s.submitAnswer);
  const closePuzzle = useGameStore(s => s.closePuzzle);
  const loseHeart = useGameStore(s => s.loseHeart);
  const activateCharm = useGameStore(s => s.activateCharm);
  const useHint = useGameStore(s => s.useHint);

  const [expression, setExpression] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [isTouchUI, setIsTouchUI] = useState(false);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1279px)');
    setIsTouchUI(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouchUI(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isTreasure = activeDoorId ? rooms[activeDoorId]?.type === 'TREASURE' : false;
  const requireAll = activePuzzle?.requireAll ?? false;

  useEffect(() => {
    if (activePuzzle) { setExpression(''); setFeedback(null); setHintUsed(false); setShowingAnswer(false); }
  }, [activePuzzle]);

  const insertAtCursor = useCallback((text: string) => {
    const input = inputRef.current;
    if (!input || isTouchUI) { setExpression(prev => prev + text); setFeedback(null); return; }
    const start = input.selectionStart ?? expression.length;
    const end = input.selectionEnd ?? expression.length;
    const next = expression.slice(0, start) + text + expression.slice(end);
    setExpression(next);
    setFeedback(null);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + text.length, start + text.length);
    });
  }, [isTouchUI, expression]);

  const handleBackspace = useCallback(() => {
    setExpression(prev => {
      const trimmed = prev.trimEnd();
      // Remove trailing operator with surrounding spaces e.g. " + "
      const opMatch = trimmed.match(/^(.*?)\s*[\+\-\*\/×÷]\s*$/);
      if (opMatch) return opMatch[1];
      // Remove trailing number (possibly multi-digit)
      const numMatch = trimmed.match(/^(.*\D|\s*)(\d+)$/);
      if (numMatch) return numMatch[1];
      // Fallback: remove last char
      return prev.slice(0, -1);
    });
    setFeedback(null);
  }, []);

  if (!activePuzzle) return null;

  const liveValidation = expression.trim()
    ? checkAnswer(expression, activePuzzle.target, activePuzzle.numbers, activePuzzle.requireAll)
    : null;
  const showError = liveValidation?.error ?? null;

  const handleSubmit = () => {
    const correct = submitAnswer(expression);
    if (correct) {
      dragonRef.current?.playFireBreath();
      setFeedback(null);
    } else {
      const result = checkAnswer(expression, activePuzzle.target, activePuzzle.numbers, activePuzzle.requireAll);
      setFeedback(result.error ? `⚠ ${result.error}` : 'Wrong answer! -1 ❤️');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      if (!result.error) setExpression('');
    }
  };

  const handleGiveUp = () => {
    setShowingAnswer(true);
    setTimeout(() => {
      setShowingAnswer(false);
      loseHeart();
      closePuzzle();
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') handleGiveUp();
  };

  const handleHint = () => {
    const hint = useHint();
    if (hint) {
      setExpression(hint);
      setHintUsed(true);
      setFeedback(null);
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (val: string) => {
    // Strip parentheses on easy/medium
    if (!requireAll) val = val.replace(/[()]/g, '');
    setExpression(val);
    setFeedback(null);
  };

  const OPS = activePuzzle.operations.map(op => ({
    label: op === '*' ? '×' : op === '/' ? '÷' : op,
    insert: op === '*' ? ' * ' : op === '/' ? ' / ' : ` ${op} `,
  }));

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className={`bg-purple-950 border border-purple-700/60 rounded-2xl w-full max-w-md shadow-2xl shadow-purple-950/50 transition-transform ${shaking ? 'animate-bounce' : ''} ${isTouchUI ? 'max-h-[96vh] flex flex-col overflow-hidden' : 'p-5 md:p-6'}`}>

        {/* === TOUCH UI LAYOUT === */}
        {isTouchUI ? (
          <>
            {/* Compact header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{isTreasure ? '💎' : '🚪'}</span>
                <div>
                  <div className="text-purple-100 font-bold text-base leading-tight">
                    {isTreasure ? 'Treasure Locked!' : 'Door Locked!'}
                  </div>
                  <div className="text-purple-400 text-xs">Make an equation that equals the target!</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!hintUsed ? (
                  <button onClick={handleHint} className="text-xs text-amber-400 border border-amber-800 rounded px-2 py-1">Hint −5</button>
                ) : (
                  <span className="text-xs text-gray-600">Hint used</span>
                )}
                <InfoTooltip requireAll={requireAll} />
              </div>
            </div>

            {/* Target + formula display side by side */}
            <div className="flex gap-2 px-4 pb-2">
              <div className="bg-purple-900/60 border border-amber-700/40 rounded-xl px-3 py-2 text-center flex-shrink-0">
                <div className="text-purple-400 text-xs">🎯 Target</div>
                <div className="text-3xl font-extrabold text-amber-400 leading-tight">{activePuzzle.target}</div>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="bg-purple-950/60 border border-purple-600/40 rounded-xl px-3 py-2 min-h-[52px] flex items-center">
                  <span className={`text-white text-lg font-mono w-full ${!expression ? 'text-purple-600' : ''}`}>
                    {expression || 'Tap to build…'}
                  </span>
                </div>
                {showError && <div className="text-xs text-orange-400 font-mono px-1">⚠ {showError}</div>}
                {feedback && <div className="text-xs text-red-400 px-1">{feedback}</div>}
              </div>
            </div>

            {/* Charms (compact) */}
            {charms.length > 0 && (
              <div className="flex items-center gap-2 px-4 pb-2">
                <span className="text-purple-400 text-xs">✨ Charms:</span>
                {charms.map((charm, i) => (
                  <button
                    key={i}
                    onClick={() => charm === 'LIGHTNING' ? activateCharm(charm) : activateCharm(charm, 0)}
                    className="text-lg bg-purple-800/60 hover:bg-purple-700/60 border border-purple-600/50 rounded-xl px-2 py-1 transition-colors"
                    title={charm === 'FIRE' ? '🔥 Double first hint number' : charm === 'ICE' ? '❄️ Halve first hint number' : '⚡ Regenerate all hint numbers'}
                  >
                    {charm === 'FIRE' ? '🔥' : charm === 'ICE' ? '❄️' : '⚡'}
                  </button>
                ))}
              </div>
            )}

            {/* Keypad */}
            <div className="px-3 pb-2 flex flex-col gap-2">
              {/* Hint number buttons — grid */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-purple-500 text-xs mr-1">{requireAll ? 'Use all:' : 'Numbers:'}</span>
                {activePuzzle.numbers.map((n, i) => (
                  <button
                    key={i}
                    onPointerDown={e => { e.preventDefault(); insertAtCursor(String(n)); }}
                    className="bg-purple-700 active:bg-purple-500 active:scale-95 text-purple-100 font-bold rounded-xl border border-purple-500 transition-all select-none text-lg px-4 py-2.5 flex-1 min-w-[52px]"
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Operators + parens + backspace row */}
              <div className="flex gap-1.5">
                {OPS.map(({ label, insert }) => (
                  <button
                    key={label}
                    onPointerDown={e => { e.preventDefault(); insertAtCursor(insert); }}
                    className="bg-indigo-800 active:bg-indigo-600 active:scale-95 text-white font-bold text-xl rounded-xl border border-indigo-600 transition-all select-none flex-1 py-3"
                  >
                    {label}
                  </button>
                ))}
                {requireAll && (
                  <>
                    <button onPointerDown={e => { e.preventDefault(); insertAtCursor('('); }} className="bg-indigo-800 active:bg-indigo-600 active:scale-95 text-purple-200 font-bold text-xl flex-1 py-3 rounded-xl border border-indigo-600 transition-all select-none">(</button>
                    <button onPointerDown={e => { e.preventDefault(); insertAtCursor(')'); }} className="bg-indigo-800 active:bg-indigo-600 active:scale-95 text-purple-200 font-bold text-xl flex-1 py-3 rounded-xl border border-indigo-600 transition-all select-none">)</button>
                  </>
                )}
                <button
                  onPointerDown={e => { e.preventDefault(); handleBackspace(); }}
                  className="bg-red-900/70 active:bg-red-700 text-red-300 font-bold text-xl px-4 py-3 rounded-xl border border-red-700/50 transition-colors select-none"
                >⌫</button>
              </div>
            </div>

            {/* Show answer box when giving up */}
            {showingAnswer && (
              <div className="mx-3 mb-2 bg-amber-900/40 border border-amber-600/50 rounded-xl p-3 text-center">
                <div className="text-amber-400 text-xs mb-1">One way to solve it:</div>
                <div className="text-white text-lg font-mono">{activePuzzle.solution} = {activePuzzle.target}</div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 px-3 pb-4">
              <button
                onPointerDown={e => { e.preventDefault(); setExpression(''); setFeedback(null); }}
                className="bg-purple-900/60 text-red-400 text-sm font-semibold px-3 py-3 rounded-xl border border-purple-700/50 transition-colors select-none"
              >Clear</button>
              <button
                onClick={handleSubmit}
                disabled={!expression.trim() || showingAnswer}
                className="flex-1 bg-gradient-to-r from-emerald-700 to-emerald-600 disabled:opacity-40 text-white font-bold py-3 rounded-2xl transition-colors text-lg shadow-lg shadow-emerald-900/30"
              >
                ✓ Submit
              </button>
              <button
                onClick={handleGiveUp}
                disabled={showingAnswer}
                className="bg-red-900/70 border border-red-700/50 text-white font-bold px-3 py-3 rounded-2xl transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Give Up<br />−1 ❤️
              </button>
            </div>

            {/* Hidden input to keep keyboard-accessible submit working */}
            <input
              ref={inputRef}
              type="text"
              inputMode="none"
              value={expression}
              onChange={() => {}}
              onKeyDown={handleKeyDown}
              readOnly
              className="sr-only"
              aria-hidden="true"
            />
          </>
        ) : (
          /* === DESKTOP LAYOUT (unchanged) === */
          <>
            {/* Header */}
            <div className="text-center mb-4">
              <div className="text-3xl mb-1">{isTreasure ? '💎' : '🚪'}</div>
              <h2 className="text-xl font-bold text-purple-100">
                {isTreasure ? 'Treasure is Locked!' : 'Door is Locked!'}
              </h2>
              <p className="text-purple-400 text-sm">
                {isTreasure
                  ? 'Solve the puzzle to claim your treasure (+20 score, +1 ❤️)'
                  : 'Make an equation that equals the target!'}
              </p>
            </div>

            {/* Target */}
            <div className="bg-purple-900/60 border border-amber-700/40 rounded-2xl p-4 mb-4 text-center">
              <div className="text-purple-400 text-sm mb-1">🎯 Target Number</div>
              <div className="text-5xl font-extrabold text-amber-400">{activePuzzle.target}</div>
            </div>

            {/* Numbers */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-purple-300 text-sm">
                  {requireAll
                    ? 'Use ALL of these numbers! (each one once)'
                    : 'Use some of these numbers to hit the target:'}
                </span>
                <InfoTooltip requireAll={requireAll} />
              </div>
              <div className="flex gap-2 flex-wrap mb-3">
                {activePuzzle.numbers.map((n, i) => (
                  <button
                    key={i}
                    onPointerDown={e => { e.preventDefault(); insertAtCursor(String(n)); }}
                    className="bg-purple-700 hover:bg-purple-600 active:scale-95 text-purple-100 font-bold rounded-xl border border-purple-500 transition-all select-none text-xl px-4 py-2"
                    title="Tap to insert"
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Operator buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-purple-500 text-xs">Math signs:</span>
                {OPS.map(({ label, insert }) => (
                  <button
                    key={label}
                    onPointerDown={e => { e.preventDefault(); insertAtCursor(insert); }}
                    className="bg-indigo-800 hover:bg-indigo-700 active:scale-95 text-white font-bold text-lg rounded-xl border border-indigo-600 transition-all select-none w-11 h-11"
                  >
                    {label}
                  </button>
                ))}
                {requireAll && (
                  <>
                    <button onPointerDown={e => { e.preventDefault(); insertAtCursor('('); }} className="bg-indigo-800 hover:bg-indigo-700 active:scale-95 text-purple-200 font-bold text-lg w-11 h-11 rounded-xl border border-indigo-600 transition-all select-none">(</button>
                    <button onPointerDown={e => { e.preventDefault(); insertAtCursor(')'); }} className="bg-indigo-800 hover:bg-indigo-700 active:scale-95 text-purple-200 font-bold text-lg w-11 h-11 rounded-xl border border-indigo-600 transition-all select-none">)</button>
                  </>
                )}
                <div className="ml-auto">
                  <button
                    onPointerDown={e => { e.preventDefault(); setExpression(''); setFeedback(null); inputRef.current?.focus(); }}
                    className="bg-purple-900/60 hover:bg-purple-800/60 text-red-400 text-xs font-semibold px-2 h-10 rounded-xl border border-purple-700/50 transition-colors"
                  >Clear</button>
                </div>
              </div>
            </div>

            {/* Charms */}
            {charms.length > 0 && (
              <div className="mb-4">
                <div className="text-purple-400 text-sm mb-2">✨ Use a charm:</div>
                <div className="flex gap-2">
                  {charms.map((charm, i) => (
                    <button
                      key={i}
                      onClick={() => charm === 'LIGHTNING' ? activateCharm(charm) : activateCharm(charm, 0)}
                      className="text-xl bg-purple-800/60 hover:bg-purple-700/60 border border-purple-600/50 rounded-xl px-3 py-2 transition-colors"
                      title={charm === 'FIRE' ? '🔥 Double first hint number' : charm === 'ICE' ? '❄️ Halve first hint number' : '⚡ Regenerate all hint numbers'}
                    >
                      {charm === 'FIRE' ? '🔥' : charm === 'ICE' ? '❄️' : '⚡'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Expression input */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-purple-300 text-sm font-semibold">📝 Your equation:</label>
                {!hintUsed ? (
                  <button
                    onClick={handleHint}
                    className="text-xs text-amber-400 hover:text-amber-300 border border-amber-800 hover:border-amber-600 rounded px-2 py-0.5 transition-colors"
                    title="Show a working answer — costs 5 points"
                  >
                    Hint (-5 pts)
                  </button>
                ) : (
                  <span className="text-xs text-gray-600">Hint used (-5 pts)</span>
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                inputMode="text"
                value={expression}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full bg-purple-950/60 border border-purple-600/40 rounded-xl px-4 py-3 text-white text-lg font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
              />
              {showError && (
                <div className="mt-1 text-sm text-orange-400 font-mono">⚠ {showError}</div>
              )}
              {feedback && <div className="mt-1 text-sm text-red-400">{feedback}</div>}
            </div>

            {/* Show answer box when giving up */}
            {showingAnswer && (
              <div className="bg-amber-900/40 border border-amber-600/50 rounded-xl p-3 text-center mb-3">
                <div className="text-amber-400 text-xs mb-1">One way to solve it:</div>
                <div className="text-white text-lg font-mono">{activePuzzle.solution} = {activePuzzle.target}</div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={!expression.trim() || showingAnswer}
                className="flex-1 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-colors text-lg shadow-lg shadow-emerald-900/30"
              >
                Submit
              </button>
              <button
                onClick={handleGiveUp}
                disabled={showingAnswer}
                className="flex-1 bg-red-900/70 hover:bg-red-800/70 border border-red-700/50 text-white font-bold py-3 rounded-2xl transition-colors text-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Give Up -1 ❤️
              </button>
            </div>
            <p className="text-center text-purple-600 text-xs mt-2">Enter to submit · Esc to give up · Tap numbers to build your equation</p>
          </>
        )}
      </div>
    </div>
  );
}
