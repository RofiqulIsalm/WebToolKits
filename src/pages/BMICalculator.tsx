                      aria-pressed={scheme === 'who'}
                      className={`min-h-[44px] rounded-lg text-sm font-medium transition-all ${scheme === 'who' ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow' : 'text-slate-200 hover:bg-white/5'}`}>
                      WHO
                    </motion.button>
                    <motion.button whileTap={reduceMotion ? {} : { scale: 0.96 }} onClick={() => switchScheme('asian')}
                      aria-pressed={scheme === 'asian'}
                      className={`min-h-[44px] rounded-lg text-sm font-medium transition-all ${scheme === 'asian' ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow' : 'text-slate-200 hover:bg-white/5'}`}>
                      Asian
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Height */}
              <div className="mb-5">
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Height ({ranges.h.label})</label>
                <input
                  type="text" inputMode="decimal" value={heightInput}
                  onChange={(e) => onHeightChange(e.target.value)} onBlur={normalizeHeight}
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-base sm:text-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder={unit === 'metric' ? 'e.g., 160' : 'e.g., 63.0'}
                />
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Range {ranges.h.min}–{ranges.h.max} {ranges.h.label}</p>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Weight ({ranges.w.label})</label>
                <input
                  type="text" inputMode="decimal" value={weightInput}
                  onChange={(e) => onWeightChange(e.target.value)} onBlur={normalizeWeight}
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-base sm:text-lg text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder={unit === 'metric' ? 'e.g., 55.0' : 'e.g., 121.3'}
                />
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Range {ranges.w.min}–{ranges.w.max} {ranges.w.label}</p>
              </div>
            </div>

            {/* Results Card */}
            <div className="p-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/50 via-cyan-400/40 to-indigo-500/50 shadow-xl min-w-0">
              <div className="rounded-2xl p-4 sm:p-6 bg-slate-900/70 border border-white/10 backdrop-blur-xl">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-5">Your result</h2>

                <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 mb-5 sm:mb-6">
                  {/* Animated BMI ring */}
                  <motion.div
                    className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full shrink-0 grid place-items-center"
                    style={{ background: `conic-gradient(${ring} ${ringPct}%, rgba(148,163,184,0.25) 0)` }}
                    aria-label="BMI progress ring"
                    animate={reduceMotion ? {} : { rotate: [0, 2, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className="absolute inset-2 rounded-full bg-slate-900/90 border border-white/10 grid place-items-center shadow-inner overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={Number.isFinite(bmi) ? bmi.toFixed(1) : '-'}
                          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                          className="text-xl sm:text-2xl font-bold text-white tabular-nums"
                        >
                          {Number.isFinite(bmi) ? bmi.toFixed(1) : '—'}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    <span className="absolute inset-0 rounded-full blur-xl" style={{ background: `${ring}22` }} />
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="inline-flex items-center gap-2">
                      <Activity className="h-5 w-5 text-cyan-300 drop-shadow" />
                      <span className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-medium ${badge}`}>
                        {category} ({scheme === 'who' ? 'WHO' : 'Asian'})
                      </span>
                    </div>
                    <p className="text-slate-300 mt-2 text-xs sm:text-sm leading-relaxed">
                      BMI is a screening tool. Age, sex, muscle, and ethnicity can affect interpretation.
                    </p>

                    {/* Healthy weight range + target */}
                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                      <div className="rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-slate-200">
                        <div className="opacity-70 text-[11px] sm:text-xs">Healthy weight range for your height</div>
                        <div className="font-medium">{fmtWeight(minKg)} – {fmtWeight(maxKg)}</div>
                      </div>
                      <div className="rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-slate-200">
                        <div className="opacity-70 text-[11px] sm:text-xs">Target (mid of normal)</div>
                        <div className="font-medium">
                          {fmtWeight(targetKg)} {Number.isFinite(deltaKg) ? (
                            <span className="opacity-80">&nbsp;•&nbsp;{deltaKg > 0 ? 'Gain' : deltaKg < 0 ? 'Lose' : 'At target'} {fmtWeight(Math.abs(deltaKg))}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

               
                 
                {/* Legend */}
                <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between"><span className="text-slate-300">Underweight</span><span className="text-blue-300">Below 18.5</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-300">Normal</span><span className="text-emerald-300">18.5–{scheme === 'asian' ? '22.9' : '24.9'}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-300">Overweight</span><span className="text-amber-300">{scheme === 'asian' ? '23–24.9' : '25–29.9'}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-300">Obese</span><span className="text-rose-300">{scheme === 'asian' ? '25+' : '30+'}</span></div>
                </div>
              </div>
            </div>
          </div> 

         {/* --- Share / Download summary (preview + fixed export) --- */}
          <div className="mt-4">
            <div className="mb-2 text-slate-300 text-sm">Share / Download summary</div>
          
            {/* On-page responsive preview */}
            <ShareCard className="w-full max-w-[760px]" />
          
            {/* Hidden export card (always same pixels for PNG) */}
            <div className="fixed -left-[9999px] top-0" style={{ width: EXPORT_W, height: EXPORT_H }}>
              <div ref={exportRef} className="w-[1200px] h-[500px]">
                <ShareCard className="w-[1200px] h-[500px]" />
              </div>
            </div>
          
            <div className="mt-2">
              <button
                onClick={downloadImage}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/10 border border-white/15 text-slate-100 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              >
                <Download className="h-4 w-4" /> Download Image
              </button>
            </div>
          </div>


          {/* Roadmap Section */}
          <div className="mt-6 sm:mt-10 rounded-2xl p-4 sm:p-6 bg-white/5 border border-white/10 backdrop-blur-xl">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">{roadmap.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-lg p-3 bg-white/5 border border-white/10">
                <div className="text-slate-300 text-sm font-medium mb-2">Weekly Focus</div>
                <ul className="text-slate-200 text-sm list-disc pl-5 space-y-1">
                  {roadmap.bullets.weekly.map((x: string, i: number) => <li key={i}>{x}</li>)}
                </ul>
              </div>
              <div className="rounded-lg p-3 bg-white/5 border border-white/10 md:col-span-2">
                <div className="text-slate-300 text-sm font-medium mb-2">Habits</div>
                <ul className="text-slate-200 text-sm list-disc pl-5 space-y-1">
                  {roadmap.bullets.habits.map((x: string, i: number) => <li key={i}>{x}</li>)}
                </ul>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-3">{roadmap.bullets.note}</p>
          </div>

          <AdBanner type="bottom" />
          <RelatedCalculators currentPath="/bmi-calculator" category="math-tools" />
        </div>
      </div>
    </>
  );
};

export default BMICalculator;
