 { key: 'room',   c: 20,   Icon: Home,     aria: 'Room (20°C)',
                    anim: { y: [0, -3, 0, 2, 0] }, dur: 2.6 },
                  { key: 'body',   c: 37,   Icon: Heart,    aria: 'Body (37°C)',
                    anim: { scale: [1, 1.12, 1] }, dur: 1.6 },
                  { key: 'boil',   c: 100,  Icon: Flame,    aria: 'Boil (100°C)',
                    anim: { y: [0, -6, 0], rotate: [0, 2, 0] }, dur: 1.8 },
                ].map((p, i) => (
                  <motion.button
                    key={p.key}
                    onClick={() => { setScale('C'); setValueStr(String(p.c)); }}
                    className="group relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-800/70 border border-white/10 text-gray-200 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 outline-none"
                    title={p.aria}
                    aria-label={p.aria}
                    whileHover={{ y: -2, scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    {/* subtle hover ring */}
                    <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/10 group-hover:ring-white/20" />
          
                    {/* animated icon */}
                    <motion.span
                      animate={
                        prefersReduced
                          ? undefined
                          : { ...p.anim }
                      }
                      transition={
                        prefersReduced
                          ? undefined
                          : { duration: p.dur, repeat: Infinity, ease: 'easeInOut' }
                      }
                      className="grid place-items-center"
                    >
                      <p.Icon className="w-5 h-5" />
                    </motion.span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>


          {/* Warning */}
          <AnimatePresence>
            {belowAbsoluteZero && ( 
              <motion.div
                className="mt-4 rounded-lg bg-red-900/40 border border-red-800 text-red-200 px-4 py-2"
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -12, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                ⚠️ This value is below absolute zero for the selected scale.
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Result cards (all three with overlays) */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {/* Celsius */}
          <motion.div
            className="relative overflow-hidden rounded-2xl p-6 border bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:ring-2 hover:ring-white/20 transition-shadow"
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            {...softHover}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {!prefersReduced && heatState === 'hot' && <FireOverlay intense={extremeState === 'hot'} />}
              {!prefersReduced && heatState === 'cold' && <IceOverlay intense={extremeState === 'cold'} />}
              {/* NEW: neutral overlay */}
              {!prefersReduced && heatState === 'normal' && <NeutralOverlay />}
            </AnimatePresence>
            <Tilt> 
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Thermometer className="h-5 w-5 text-blue-300" />
                  <h3 className="text-lg font-semibold text-white">Celsius (°C)</h3>
                </div>
                <div className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold text-gray-100">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={display.C}
                      initial={{ y: 8, opacity: 0, scale: 0.995 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -8, opacity: 0, scale: 0.997 }}
                      transition={spring}
                    >
                      {display.C}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="mt-2 text-sm text-gray-300/80">Input converted to °C</div>
              </div>
            </Tilt>
          </motion.div>

          {/* Fahrenheit */}
          <motion.div
            className="relative overflow-hidden rounded-2xl p-6 border bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:ring-2 hover:ring-white/20 transition-shadow"
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            {...softHover}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {!prefersReduced && heatState === 'hot' && <FireOverlay intense={extremeState === 'hot'} />}
              {!prefersReduced && heatState === 'cold' && <IceOverlay intense={extremeState === 'cold'} />}
              {!prefersReduced && heatState === 'normal' && <NeutralOverlay />}
            </AnimatePresence>
            <Tilt>
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Thermometer className="h-5 w-5 text-rose-300" />
                  <h3 className="text-lg font-semibold text-white">Fahrenheit (°F)</h3>
                </div>
                <div className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold text-gray-100">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={display.F}
                      initial={{ y: 8, opacity: 0, scale: 0.995 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -8, opacity: 0, scale: 0.997 }}
                      transition={spring}
                    >
                      {display.F}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="mt-2 text-sm text-gray-300/80">Input converted to °F</div>
              </div>
            </Tilt>
          </motion.div>

          {/* Kelvin */}
          <motion.div
            className="relative overflow-hidden rounded-2xl p-6 border bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:ring-2 hover:ring-white/20 transition-shadow"
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            {...softHover}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {!prefersReduced && heatState === 'hot' && <FireOverlay intense={extremeState === 'hot'} />}
              {!prefersReduced && heatState === 'cold' && <IceOverlay intense={extremeState === 'cold'} />}
              {!prefersReduced && heatState === 'normal' && <NeutralOverlay />}
            </AnimatePresence>
            <Tilt> 
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Thermometer className="h-5 w-5 text-violet-300" />
                  <h3 className="text-lg font-semibold text-white">Kelvin (K)</h3>
                </div>
                <div className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold text-gray-100">
                  <AnimatePresence mode="wait">
                    <motion.span 
                      key={display.K}
                      initial={{ y: 8, opacity: 0, scale: 0.995 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -8, opacity: 0, scale: 0.997 }}
                      transition={spring}
                    >
                      {display.K}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="mt-2 text-sm text-gray-300/80">Input converted to K</div>
              </div>
            </Tilt>
          </motion.div>
        </motion.div> 

        {/* Quick reference */}
        <motion.div {...fadeUp(0.1)} className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-xl p-6 shadow mb-8 ring-1 ring-white/10">
          <h4 className="font-semibold text-white mb-3">Quick Reference</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg p-4 bg-blue-950/40 border border-white/10"> 
              <div className="text-blue-200/90 font-medium mb-1">Water freezes</div>
              <div className="text-gray-200">0°C = 32°F = 273.15K</div>
            </div>
            <div className="rounded-lg p-4 bg-rose-950/40 border border-white/10">
              <div className="text-rose-200/90 font-medium mb-1">Room temperature</div>
              <div className="text-gray-200">20°C = 68°F = 293.15K</div>
            </div>
            <div className="rounded-lg p-4 bg-violet-950/40 border border-white/10">
              <div className="text-violet-200/90 font-medium mb-1">Water boils</div>
              <div className="text-gray-200">100°C = 212°F = 373.15K</div>
            </div>
          </div>
        </motion.div> 

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/temper ature-converter" category="unit-converters" />
      </motion.div>
    </> 
  );  
};  
 
export default TemperatureConverter;
 