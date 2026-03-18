import { useRef, useState, useEffect, useCallback } from 'react';
import HatcheryGame from '../../game/HatcheryGame';
import type { HatcherySceneRef } from '../../game/HatcheryGame';
import { useHatcheryStore } from '../../store/useHatcheryStore';
import { DRAGON_UI_INFO } from '../../game/scenes/HatcheryScene';

const TIMER_SECONDS = 20;

const DRAGON_NAMES = [
  'Ember', 'Sparky', 'Blaze', 'Sunny', 'Cinder',
  'Crimson', 'Scarlet', 'Fury', 'Ember Rose', 'Magma',
  'Frost', 'Steel', 'Shadow', 'Smoke', 'Void',
  'Aurum', 'Lava King', 'Obsidian', 'Nebula', 'Ancient',
];

const DIFFICULTY_COLORS = {
  easy:   'text-emerald-400',
  medium: 'text-amber-400',
  hard:   'text-red-400',
};

type FeedbackState = { text: string; color: string } | null;

export function HatcheryGameScreen() {
  const store = useHatcheryStore();
  const sceneRef = useRef<HatcherySceneRef>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [shakeInput, setShakeInput] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [dragonsOpen, setDragonsOpen] = useState(false);
  const [isHatching, setIsHatching] = useState(false);
  const [hatchingName, setHatchingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Show egg when problem loads
  useEffect(() => {
    if (store.screen === 'GAME' && previewIdx === null) {
      sceneRef.current?.showEgg();
    }
  }, [store.screen, previewIdx]);

  // Focus input when not animating and not previewing
  useEffect(() => {
    if (!isAnimating && previewIdx === null) {
      inputRef.current?.focus();
    }
  }, [isAnimating, store.currentProblem, previewIdx]);

  const handleTimeout = useCallback(() => {
    clearTimer();
    setIsAnimating(true);
    const answer = store.currentProblem?.answer ?? '?';
    setFeedback({ text: `Time's up! Answer was ${answer}`, color: 'text-red-400' });
    store.submitAnswer(-999999);
    sceneRef.current?.updateEggProgress(0);
    setTimeout(() => {
      setFeedback(null);
      sceneRef.current?.showEgg();
      setIsAnimating(false);
      inputRef.current?.focus();
    }, 1200);
  }, [clearTimer, store]);

  // Countdown timer
  useEffect(() => {
    if (isAnimating || previewIdx !== null) return;
    clearTimer();
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleTimeout(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimer();
  }, [store.currentProblem, isAnimating, previewIdx, clearTimer, handleTimeout]);

  const handleSubmit = useCallback(() => {
    if (isAnimating || !store.currentProblem || previewIdx !== null) return;
    const parsed = parseInt(answerInput, 10);
    if (isNaN(parsed)) return;

    clearTimer();
    setIsAnimating(true);
    setAnswerInput('');
    setHintText(null);

    const result = store.submitAnswer(parsed);

    if (result.correct) {
      let msg = `Correct! +${result.pointsEarned} pts`;
      if (result.pointsEarned >= 45) msg += ' ⚡ Speed + Streak!';
      else if (result.pointsEarned >= 35) msg += ' ⚡ Speed bonus!';
      else if (result.pointsEarned > 20) msg += ' Streak bonus!';
      if (result.newDragon) msg += ' 🐉 New dragon!';
      setFeedback({ text: msg, color: 'text-emerald-400' });

      if (result.newDragon) {
        const dragonIdx = result.newDragonIndex;
        if (dragonIdx >= 0) {
          setIsHatching(true);
          setHatchingName(DRAGON_NAMES[dragonIdx] ?? '');
          sceneRef.current?.playHatch(dragonIdx, () => {
            setIsHatching(false);
            setFeedback(null);
            sceneRef.current?.showEgg();
            sceneRef.current?.updateEggProgress(0);
            setIsAnimating(false);
            inputRef.current?.focus();
          });
        }
      } else {
        sceneRef.current?.updateEggProgress(result.newHatchProgress as 0 | 1 | 2);
        setTimeout(() => {
          setFeedback(null);
          setIsAnimating(false);
          inputRef.current?.focus();
        }, 500);
      }
    } else {
      const penaltyMsg = result.pointsEarned < 0 ? ` (${result.pointsEarned} pts)` : '';
      setFeedback({ text: `Wrong! Answer was ${store.currentProblem!.answer}${penaltyMsg}`, color: 'text-red-400' });
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
      sceneRef.current?.updateEggProgress(0);
      setTimeout(() => {
        setFeedback(null);
        sceneRef.current?.showEgg();
        setIsAnimating(false);
        inputRef.current?.focus();
      }, 1200);
    }
  }, [isAnimating, store, answerInput, clearTimer, previewIdx]);

  const handleDragonClick = useCallback((idx: number) => {
    if (isAnimating) return;
    if (idx >= store.dragonsUnlocked) return;
    clearTimer();
    setPreviewIdx(idx);
    sceneRef.current?.previewDragon(idx);
  }, [isAnimating, store.dragonsUnlocked, clearTimer]);

  const handleClosePreview = useCallback(() => {
    setPreviewIdx(null);
    sceneRef.current?.showEgg();
    sceneRef.current?.updateEggProgress(store.hatchProgress as 0 | 1 | 2);
  }, [store.hatchProgress]);

  const handleHint = () => {
    const hint = store.useHint();
    if (hint) setHintText(hint);
  };

  const streakFire = store.currentStreak >= 3 ? '🔥' : '';
  const streakDisplay = store.currentStreak >= 3 ? `${streakFire}×${store.currentStreak}` : `×${store.currentStreak}`;

  const handleNumpad = useCallback((key: string) => {
    if (isAnimating) return;
    if (key === '⌫') {
      setAnswerInput(prev => prev.slice(0, -1));
    } else if (key === '±') {
      setAnswerInput(prev => prev.startsWith('-') ? prev.slice(1) : prev ? '-' + prev : '-');
    } else {
      setAnswerInput(prev => prev.length < 6 ? prev + key : prev);
    }
  }, [isAnimating]);

  const dragonGrid = (
    <div className="grid grid-cols-5 gap-1.5">
      {Array.from({ length: 20 }, (_, i) => {
        const unlocked = i < store.dragonsUnlocked;
        const info = DRAGON_UI_INFO[i];
        const isPreviewing = previewIdx === i;
        return (
          <button
            key={i}
            onClick={() => handleDragonClick(i)}
            disabled={!unlocked || isAnimating}
            title={unlocked ? `${DRAGON_NAMES[i]} — click to preview` : `Dragon ${i + 1} (locked)`}
            className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center text-xs transition-all relative overflow-hidden ${
              unlocked
                ? `border-2 cursor-pointer hover:scale-110 active:scale-95 ${isPreviewing ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-purple-950' : ''}`
                : 'bg-purple-950 border border-purple-800/50 opacity-40 cursor-not-allowed'
            }`}
            style={unlocked ? { backgroundColor: info.color, borderColor: info.accentColor } : undefined}
          >
            {unlocked ? (
              <span className="text-lg">{info.hasCrown ? '👑' : info.hasArmor ? '⚔️' : '🐉'}</span>
            ) : (
              <span>🥚</span>
            )}
            {unlocked && (
              <span className="text-white font-bold" style={{ fontSize: '9px' }}>
                {DRAGON_NAMES[i].split(' ')[0]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-indigo-950 to-gray-950 flex items-start justify-center p-3 md:p-4">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-4xl">

        {/* LEFT: Phaser canvas — fullscreen overlay when hatching */}
        <div className={
          isHatching
            ? 'fixed inset-0 z-50 bg-purple-950 flex flex-col items-center justify-center gap-6 p-4'
            : 'flex flex-col items-center gap-2 w-full md:w-auto md:flex-shrink-0 order-2 md:order-1'
        }>
          {isHatching && (
            <div className="text-center">
              <p className="text-purple-400 text-sm uppercase tracking-widest mb-1">A new dragon hatches</p>
              <p className="text-amber-400 text-3xl font-bold">{hatchingName}</p>
            </div>
          )}
          <div className={isHatching ? 'w-[min(90vw,80vh)]' : 'w-full max-w-[400px] md:w-[300px] lg:w-[360px] xl:w-[400px]'}>
            <HatcheryGame ref={sceneRef} />
          </div>
          {!isHatching && (
            <div className="flex items-center justify-center gap-2 h-6 w-full max-w-[400px]">
              {previewIdx !== null ? (
                <>
                  <span className="text-amber-300 text-sm font-bold">{DRAGON_NAMES[previewIdx]}</span>
                  <button
                    onClick={handleClosePreview}
                    className="text-purple-400 hover:text-purple-200 text-xs border border-purple-700 rounded px-2 py-0.5 transition-colors"
                  >
                    ← Back
                  </button>
                </>
              ) : (
                <p className="text-purple-400 text-sm font-medium">
                  {store.dragonsUnlocked > 0 ? DRAGON_NAMES[store.dragonsUnlocked - 1] : 'Waiting to hatch...'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Problem + dragons — stacked vertically */}
        <div className="flex flex-col gap-3 flex-1 min-w-0 order-1 md:order-2">

          {/* Player info */}
          <div className="flex items-center gap-2 flex-wrap bg-purple-900/40 border border-purple-700/50 rounded-2xl px-4 py-3">
            <span className="text-purple-100 font-bold text-base">{store.playerName}</span>
            <span className="bg-purple-800 text-purple-200 text-xs font-bold px-2 py-1 rounded-full border border-purple-600/50">
              Grade {store.grade}
            </span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full bg-purple-800/60 border border-purple-600/50 capitalize ${DIFFICULTY_COLORS[store.difficulty]}`}>
              {store.difficulty}
            </span>
            <div className="ml-auto flex gap-4">
              <div>
                <span className="text-purple-400 text-xs">Score </span>
                <span className="text-amber-400 font-bold">{store.score}</span>
              </div>
              <div>
                <span className="text-purple-400 text-xs">Streak </span>
                <span className="text-orange-400 font-bold">{streakDisplay}</span>
              </div>
            </div>
          </div>

          {/* Problem panel */}
          {previewIdx === null ? (
            <div className="bg-purple-900/40 border border-purple-700/50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                {/* Hatch progress dots */}
                <div className="flex items-center gap-1.5">
                  <span className="text-purple-400 text-xs">Hatch:</span>
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                        i < store.hatchProgress
                          ? 'bg-amber-500 border-amber-400'
                          : 'bg-purple-800 border-purple-600'
                      }`}
                    />
                  ))}
                  <span className="text-purple-500 text-xs ml-1">{store.hatchProgress}/3</span>
                </div>
                <div className={`text-sm font-bold ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-purple-400'}`}>
                  ⏱ {timeLeft}s
                </div>
              </div>

              <div className="text-center mb-4">
                <div className="text-purple-400 text-xs mb-1">Solve:</div>
                <div className="text-white text-3xl lg:text-4xl font-bold font-mono">
                  {store.currentProblem?.expression ?? '...'} = ?
                </div>
              </div>

              {/* Desktop input — hidden on mobile and tablet, visible on wide desktop only */}
              <div className={`hidden xl:flex gap-2 mb-2 ${shakeInput ? 'animate-bounce' : ''}`}>
                <input
                  ref={inputRef}
                  type="number"
                  value={answerInput}
                  onChange={e => setAnswerInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  disabled={isAnimating}
                  placeholder="Your answer"
                  className="flex-1 bg-purple-950/60 border border-purple-600/40 rounded-xl px-4 py-2.5 text-white text-lg font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-50"
                />
                <button
                  onClick={handleSubmit}
                  disabled={isAnimating || !answerInput}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                  Go!
                </button>
              </div>

              {/* Numpad — shown on mobile and all tablets, hidden only on wide desktop */}
              <div className={`xl:hidden ${shakeInput ? 'animate-bounce' : ''}`}>
                {/* Answer display */}
                <div className={`bg-purple-950/60 border rounded-xl px-4 py-3 mb-3 text-right font-mono text-2xl font-bold min-h-[52px] transition-colors ${
                  answerInput ? 'text-white border-amber-600/60' : 'text-purple-600 border-purple-600/40'
                }`}>
                  {answerInput || '—'}
                </div>
                {/* Keypad grid */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {['7','8','9','4','5','6','1','2','3','±','0','⌫'].map(key => (
                    <button
                      key={key}
                      onPointerDown={e => { e.preventDefault(); handleNumpad(key); }}
                      disabled={isAnimating}
                      className={`rounded-xl py-3 md:py-3.5 lg:py-4 text-xl font-bold transition-all active:scale-95 disabled:opacity-40 select-none ${
                        key === '⌫'
                          ? 'bg-red-900/60 hover:bg-red-800/60 border border-red-700/50 text-red-300'
                          : key === '±'
                          ? 'bg-indigo-800/60 hover:bg-indigo-700/60 border border-indigo-600/50 text-indigo-300'
                          : 'bg-purple-800 hover:bg-purple-700 border border-purple-600/50 text-white'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
                <button
                  onPointerDown={e => { e.preventDefault(); handleSubmit(); }}
                  disabled={isAnimating || !answerInput}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xl py-3 md:py-3.5 lg:py-4 rounded-xl transition-colors active:scale-95 select-none shadow-lg shadow-amber-900/30"
                >
                  Go!
                </button>
              </div>

              {!store.hintUsed && !hintText && (
                <button
                  onClick={handleHint}
                  disabled={isAnimating}
                  className="text-purple-500 hover:text-amber-400 text-xs transition-colors disabled:opacity-40 mt-1"
                >
                  Hint (-8 pts)
                </button>
              )}

              {hintText && (
                <div className="bg-amber-900/30 border border-amber-700/40 rounded-xl p-2 text-amber-300 text-sm mt-2">
                  {hintText}
                </div>
              )}

              {feedback && (
                <div className={`mt-2 text-sm font-semibold ${feedback.color}`}>
                  {feedback.text}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-purple-900/40 border border-purple-700/50 rounded-2xl p-4 text-center">
              <p className="text-purple-400 text-sm">
                Previewing <span className="text-amber-300 font-bold">{DRAGON_NAMES[previewIdx]}</span>
              </p>
              <button onClick={handleClosePreview} className="mt-2 text-amber-400 hover:text-amber-300 text-sm underline">
                ← Back to game
              </button>
            </div>
          )}

          {/* Dragons section — collapsible */}
          <div className="bg-purple-900/40 border border-purple-700/50 rounded-2xl overflow-hidden">
            {/* Header — always visible, tap to toggle */}
            <button
              onClick={() => setDragonsOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-purple-300 text-sm font-medium">🐉 Dragons</span>
                <span className="text-amber-400 font-bold text-sm">{store.dragonsUnlocked}/20</span>
                {/* Progress bar inline */}
                <div className="w-24 bg-purple-800 rounded-full h-1.5 hidden sm:block">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(store.dragonsUnlocked / 20) * 100}%` }}
                  />
                </div>
              </div>
              <span className={`text-purple-400 text-xs transition-transform duration-200 ${dragonsOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* Collapsible grid */}
            {dragonsOpen && (
              <div className="px-4 pb-4">
                <div className="w-full bg-purple-800 rounded-full h-1.5 mb-3 sm:hidden">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(store.dragonsUnlocked / 20) * 100}%` }}
                  />
                </div>
                {dragonGrid}
                {previewIdx !== null && (
                  <p className="text-purple-500 text-xs mt-2 text-center">
                    Previewing {DRAGON_NAMES[previewIdx]} —{' '}
                    <button onClick={handleClosePreview} className="text-amber-400 hover:text-amber-300 underline">
                      back to game
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
