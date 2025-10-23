{12}
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
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-100"
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
              className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-200"
              title="Show presets (P)"
              {...softHover}
            >
              Presets
            </motion.button>
            <motion.button
              onClick={copyAll}
              className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-200 flex items-center gap-2"
              title="Copy results (C)"
              {...softHover}
            >
              <Copy size={16} /> Copy All
            </motion.button>
            <motion.button
              onClick={exportCSV}
              className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-200 flex items-center gap-2"
              title="Download CSV"
              {...softHover}
            >
              <Download size={16} /> CSV
            </motion.button>
          </div>

          {/* Presets */}
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
                  { label: 'Freeze', c: 0 },
                  { label: 'Room', c: 20 },
                  { label: 'Body', c: 37 },
                  { label: 'Boil', c: 100 },
                ].map((p, i) => (
                  <motion.button
                    key={p.label}
                    onClick={() => applyPreset(p.c)}
                    className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-600 text-gray-300 text-sm"
                    title={`${p.c} °C`}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    {p.label}
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

        {/* Colored result cards (staggered) */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } }
          }}
        >
          {/* Celsius */}
          <motion.div
            className="relative overflow-hidden rounded-xl p-6 border bg-gradient-to-br from-blue-950 to-blue-900 border-blue-800"
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            {...softHover}
          >
            {/* HOT / COLD OVERLAYS for each card */}
            <AnimatePresence initial={false} mode="popLayout">
              {heatState === 'hot' && <FireOverlay intense={extremeState === 'hot'} />}
              {heatState === 'cold' && <IceOverlay intense={extremeState === 'cold'} />}
            </AnimatePresence>

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Thermometer className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Celsius (°C)</h3>
              </div>
              <div className="text-3xl font-semibold text-blue-50">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={display.C}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {display.C}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="mt-2 text-sm text-blue-300/80">Input converted to °C</div>
            </div>
          </motion.div>

          {/* Fahrenheit */}
          <motion.div
            className="relative overflow-hidden rounded-xl p-6 border bg-gradient-to-br from-rose-950 to-rose-900 border-rose-800"
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            {...softHover}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {heatState === 'hot' && <FireOverlay intense={extremeState === 'hot'} />}
              {heatState === 'cold' && <IceOverlay intense={extremeState === 'cold'} />}
            </AnimatePresence>

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Thermometer className="h-5 w-5 text-rose-400" />
                <h3 className="text-lg font-semibold text-white">Fahrenheit (°F)</h3>
              </div>
              <div className="text-3xl font-semibold text-rose-50">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={display.F}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {display.F}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="mt-2 text-sm text-rose-300/80">Input converted to °F</div>
            </div>
          </motion.div>

          {/* Kelvin */}
          <motion.div
            className="relative overflow-hidden rounded-xl p-6 border bg-gradient-to-br from-violet-950 to-violet-900 border-violet-800"
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            {...softHover}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {heatState === 'hot' && <FireOverlay intense={extremeState === 'hot'} />}
              {heatState === 'cold' && <IceOverlay intense={extremeState === 'cold'} />}
            </AnimatePresence>

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Thermometer className="h-5 w-5 text-violet-400" />
                <h3 className="text-lg font-semibold text-white">Kelvin (K)</h3>
              </div>
              <div className="text-3xl font-semibold text-violet-50">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={display.K}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {display.K}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="mt-2 text-sm text-violet-300/80">Input converted to K</div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div {...fadeUp(0.1)} className="rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow mb-8">
          <h4 className="font-semibold text-white mb-3">Quick Reference</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg p-4 bg-blue-950/50 border border-blue-900"> 
              <div className="text-blue-200/90 font-medium mb-1">Water freezes</div>
              <div className="text-gray-200">0°C = 32°F = 273.15K</div>
            </div>
            <div className="rounded-lg p-4 bg-rose-950/50 border border-rose-900">
              <div className="text-rose-200/90 font-medium mb-1">Room temperature</div>
              <div className="text-gray-200">20°C = 68°F = 293.15K</div>
            </div>
            <div className="rounded-lg p-4 bg-violet-950/50 border border-violet-900">
              <div className="text-violet-200/90 font-medium mb-1">Water boils</div>
              <div className="text-gray-200">100°C = 212°F = 373.15K</div>
            </div>
          </div>
        </motion.div>

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/temperature-converter" category="unit-converters" />
      </motion.div>
    </>
  );

export default TemperatureConverter;
