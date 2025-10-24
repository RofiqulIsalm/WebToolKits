 particles while extreme or neutral */}
      <AnimatePresence>
        {!prefersReduced && extremeState === 'hot' && (<><FireStormOverlay /><ParticlesPersistent type="hot" /></>)}
        {!prefersReduced && extremeState === 'cold' && (<><IceStormOverlay /><ParticlesPersistent type="cold" /></>)}
        {/* NEW: neutral gentle breeze when NOT extreme and NOT reduced-motion */}
      </AnimatePresence>

      <motion.div
        className="relative max-w-5xl mx-auto text-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Temperature Converter', url: '/temperature-converter' },
          ]}
        />

        {/* Header */}
        <motion.div
          className={`mb-8 rounded-2xl p-6 border bg-gradient-to-r backdrop-blur-md ring-1 ${(
            heatState === 'hot'
              ? 'from-orange-500/20 to-red-500/20 ring-red-400/30'
              : heatState === 'cold'
              ? 'from-sky-500/20 to-blue-500/20 ring-sky-400/30'
              : 'from-emerald-500/15 to-lime-500/15 ring-emerald-300/20' /* subtle green when neutral */
          )}`}
          {...fadeUp(0.05)}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Temperature Converter</h1>
          <p className="text-gray-200/90">
            Convert between <b>Celsius</b>, <b>Fahrenheit</b>, and <b>Kelvin</b>. Enjoy dynamic fire/ice effects for extreme temps!
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-xl p-6 shadow mb-8 ring-1 ring-white/10"
          {...fadeUp(0.1)}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Value</label>
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={valueStr}
                onChange={(e) => setValueStr(e.target.value)}
                placeholder="Enter value (default 0)"
                className="w-full px-4 py-2 rounded-xl bg-gray-800/70 border border-white/10 text-gray-100 placeholder-gray-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-gray-900 focus-visible:outline-none transition-[box-shadow] duration-200"
                aria-label="Enter temperature"
              />
              <p className="text-xs text-gray-400 mt-1">Commas allowed (1,234.5). Empty counts as 0.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Scale</label>
              <select
                value={scale}
                onChange={(e) => setScale(e.target.value as Scale)}
                className="w-full px-4 py-2 rounded-xl bg-gray-800/70 border border-white/10 text-gray-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-gray-900 focus-visible:outline-none"
              >
                <option value="C">Celsius (°C)</option>
                <option value="F">Fahrenheit (°F)</option>
                <option value="K">Kelvin (K)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Precision</label>
              <input
                type="range"
                min={0}
                max={12}
                value={precision}
                onChange={(e) => setPrecision(+e.target.value)}
                className="w-full accent-blue-500"
              />
              <div className="text-xs text-gray-400 mt-1">Decimals: {precision}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
              <select
                value={formatMode}
                onChange={(e) => setFormatMode(e.target.value as FormatMode)}
                className="w-full px-4 py-2 rounded-xl bg-gray-800/70 border border-white/10 text-gray-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-gray-900 focus-visible:outline-none"
              >
                <option value="normal">Normal</option>
                <option value="compact">Compact</option>
                <option value="scientific">Scientific</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <motion.button
              onClick={() => setShowPresets((s) => !s)}
              className={`px-3 py-2 rounded-xl border text-gray-100 bg-gray-800/70 backdrop-blur ring-1 ${
                heatState === 'normal' ? 'from-emerald-500/15 to-lime-500/15 ring-emerald-300/20' : ''
              } hover:ring-2`}
              title="Show presets"
              {...softHover}
            >
              Presets
            </motion.button>
            <motion.button
              onClick={copyAll}
              className={`px-3 py-2 rounded-xl border text-gray-100 bg-gray-800/70 backdrop-blur ring-1 ${
                heatState === 'normal' ? 'from-emerald-500/15 to-lime-500/15 ring-emerald-300/20' : ''
              } hover:ring-2 flex items-center gap-2`}
              title="Copy results"
              {...softHover}
            >
              <Copy size={16} /> Copy All
            </motion.button>
            <motion.button
              onClick={exportCSV}
              className={`px-3 py-2 rounded-xl border text-gray-100 bg-gray-800/70 backdrop-blur ring-1 ${
                heatState === 'normal' ? 'from-emerald-500/15 to-lime-500/15 ring-emerald-300/20' : ''
              } hover:ring-2 flex items-center gap-2`}
              title="Download CSV"
              {...softHover}
            >
              <Download size={16} /> CSV
            </motion.button>
          </div>

          {/* Presets */}
          {/* Presets (icon-only, animated) */}
          <AnimatePresence initial={false}>
            {showPresets && (
              <motion.div
                className="mt-3 flex flex-wrap gap-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              > 
                {[
                  // Icon presets with their target °C and a looping animation
                  { key: 'freeze', c: 0,    Icon: Snowflake, aria: 'Freeze (0°C)',
                    anim: { rotate: [0, -10, 10, 0] }, dur: 2.2 },
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
 