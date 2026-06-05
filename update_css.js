const fs = require('fs');

const cssContent = `
/* ==========================================================================
   MÉTODOS NUMÉRICOS - PREMIUM UI
   Based on Claude frontend-designer template
   ========================================================================== */

:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #13141c;
  --bg-card: #1c1e29;
  --bg-input: #0f1015;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --border-default: #2d334a;
  --border-focus: #3b82f6;
  --accent-blue: #3b82f6;
  --accent-teal: #14b8a6;
  --accent-green: #10b981;
  --accent-red: #ef4444;
  --font-display: 'Outfit', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --radius-lg: 16px;
  --radius-md: 8px;
  --radius-sm: 4px;
  --btn-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-display);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  overflow-x: hidden;
}

/* Typography elements */
h1, h2, h3, h4 { color: white; font-weight: 700; margin-bottom: 0.5rem; }
h1 { font-size: 3rem; background: linear-gradient(135deg, #3b82f6, #14b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

/* Navbar */
.navbar { position: sticky; top: 0; width: 100%; background: rgba(10, 10, 15, 0.9); backdrop-filter: blur(10px); z-index: 1000; padding: 1rem 2rem; border-bottom: 1px solid var(--border-default); display: flex; justify-content: flex-start; align-items: center; }
.navbar-brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.2rem; margin-right: 2rem; }
.navbar-logo { background: var(--accent-blue); width: 32px; height: 32px; border-radius: 8px; display: flex; justify-content: center; align-items: center; }
.nav-links { display: flex; gap: 1.5rem; list-style: none; }
.nav-link { color: var(--text-secondary); text-decoration: none; font-weight: 500; transition: color 0.2s; }
.nav-link:hover { color: white; }

/* Layout */
.section { padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; }
.section-header { text-align: center; margin-bottom: 3rem; }
.module-badge { display: inline-block; padding: 0.3rem 0.8rem; background: rgba(59, 130, 246, 0.2); color: var(--accent-blue); border-radius: 20px; font-weight: 600; font-size: 0.9rem; margin-bottom: 1rem; }

/* Cards & Forms */
.module-card { background: var(--bg-card); border-radius: var(--radius-lg); padding: 2.5rem; border: 1px solid var(--border-default); box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
.theory-section { margin-bottom: 2rem; background: var(--bg-secondary); border-radius: var(--radius-md); padding: 1.5rem; }
.theory-toggle { background: none; border: none; color: white; width: 100%; display: flex; justify-content: space-between; font-size: 1.1rem; font-family: var(--font-display); font-weight: 600; cursor: pointer; }
.theory-content { margin-top: 1rem; color: var(--text-secondary); }

.calc-form { background: var(--bg-secondary); padding: 2rem; border-radius: var(--radius-md); }
.form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
.input-group label { display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-weight: 500; font-size: 0.9rem; }
.input-group input, .input-group select { width: 100%; padding: 0.85rem 1rem; background: var(--bg-input); border: 1px solid var(--border-default); color: white; border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.95rem; transition: border-color 0.2s, box-shadow 0.2s; }
.input-group input:focus, .input-group select:focus { outline: none; border-color: var(--accent-blue); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }

/* Buttons */
.btn-group { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 2rem; }
.btn { padding: 0.8rem 1.5rem; border: none; border-radius: var(--radius-md); font-family: var(--font-display); font-weight: 600; font-size: 1rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: transform 0.2s, box-shadow 0.2s, background 0.2s; }
.btn:active { transform: scale(0.98); }
.btn-primary { background: linear-gradient(135deg, var(--accent-blue), #2563eb); color: white; box-shadow: var(--btn-shadow); }
.btn-primary:hover { box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4); }
.btn-secondary { background: var(--bg-card); color: white; border: 1px solid var(--border-default); }
.btn-secondary:hover { background: var(--border-default); }
.btn-danger { background: rgba(239, 68, 68, 0.1); color: var(--accent-red); border: 1px solid rgba(239, 68, 68, 0.2); }
.btn-danger:hover { background: rgba(239, 68, 68, 0.2); }

/* Matrices */
.matrix-section { margin-top: 2rem; background: var(--bg-card); padding: 1.5rem; border-radius: var(--radius-md); }
.matrix-input-container, .vector-input-container { display: flex; overflow-x: auto; margin-top: 1rem; align-items: center; gap: 1rem; }
.matrix-grid { display: grid; gap: 4px; padding: 0.5rem; background: var(--bg-input); border-radius: 8px; border: 1px dashed var(--border-default); }
.matrix-cell { width: 60px; height: 40px; text-align: center; border: 1px solid var(--border-default); background: var(--bg-secondary); color: white; border-radius: 4px; font-family: var(--font-mono); }
.vector-grid { display: flex; flex-direction: column; gap: 4px; }
.matrix-separator { font-weight: bold; font-size: 1.5rem; color: var(--text-secondary); }

/* Results & Charts */
.results-container { margin-top: 3rem; animation: slideUp 0.4s ease-out forwards; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.results-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1.5rem; }
.result-card { background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border-default); }
.result-value { padding: 0.8rem; background: var(--bg-input); border-radius: var(--radius-sm); margin-bottom: 0.5rem; font-family: var(--font-mono); font-size: 1.1rem; color: var(--accent-teal); border-left: 3px solid var(--accent-teal); }
.chart-container { background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 2rem; margin-top: 2rem; height: 500px; width: 100%; display: flex; justify-content: center; align-items: center; }
.chart-container canvas { max-height: 100%; max-width: 100%; }

/* Tables */
.table-wrapper { overflow-x: auto; margin-top: 2rem; border-radius: var(--radius-md); border: 1px solid var(--border-default); }
.results-table { width: 100%; border-collapse: collapse; background: var(--bg-secondary); }
.results-table th, .results-table td { padding: 1rem; text-align: center; border-bottom: 1px solid var(--border-default); font-family: var(--font-mono); }
.results-table th { background: rgba(255,255,255,0.05); color: var(--text-secondary); font-weight: 600; }
.results-table tr:hover { background: rgba(255,255,255,0.02); }

/* Utils */
.hidden { display: none !important; }
.alert-warning { background: rgba(245, 158, 11, 0.1); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); padding: 1rem; border-radius: var(--radius-md); }
.alert-danger { background: rgba(239, 68, 68, 0.1); color: var(--accent-red); border: 1px solid rgba(239, 68, 68, 0.2); padding: 1rem; border-radius: var(--radius-md); }
`;
fs.writeFileSync('css/styles.css', cssContent);
console.log('CSS actualizado con el diseño premium de Claude!');
