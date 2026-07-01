// ==UserScript==
// @name         按键映射
// @namespace    web-hotkey
// @version      1.0.0
// @description  按键映射工具
// @author       R9
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict'

  const STORAGE_KEY = 'web-hotkey-config'

  function getDefaultConfig() {
    return { version: 1, rules: [], skipInputs: true }
  }

  function loadConfig() {
    try {
      const raw = GM_getValue(STORAGE_KEY, null)
      if (!raw) return getDefaultConfig()
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.rules)) {
        return parsed
      }
      return getDefaultConfig()
    } catch {
      return getDefaultConfig()
    }
  }

  function saveConfig(config) {
    GM_setValue(STORAGE_KEY, JSON.stringify(config))
  }

  let currentConfig = loadConfig()
  let editingDomain = ''

  function escapeHtml(str) {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  function serializeCombo(mod) {
    const parts = []
    if (mod.ctrl) parts.push('Ctrl')
    if (mod.alt) parts.push('Alt')
    if (mod.shift) parts.push('Shift')
    if (mod.meta) parts.push('△')
    parts.push(mod.key ? mod.key.toUpperCase() : '?')
    return parts.join('+')
  }

  function renderRuleList(container, rules, filterDomain) {
    const filtered = rules.filter(r => r.domain === filterDomain)
    if (filtered.length === 0) {
      container.innerHTML = '<div style="color:#bbb;font-size:13px;padding:20px 0;text-align:center;">暂无规则，点击下方 + 新增规则 添加</div>'
      return
    }
    container.innerHTML = filtered.map((rule, idx) => {
      const src = serializeCombo(rule.source)
      const tgt = serializeCombo(rule.target)
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;margin-bottom:6px;background:#f8f9fa;border-radius:6px;font-size:13px;">
        <span><strong>${src}</strong> → <strong>${tgt}</strong></span>
        <div>
          <button data-rule-idx="${idx}" class="whk-edit-btn" style="padding:4px 10px;border:1px solid #ddd;border-radius:4px;background:#fff;font-size:12px;cursor:pointer;margin-right:4px;">编辑</button>
          <button data-rule-idx="${idx}" class="whk-del-btn" style="padding:4px 10px;border:1px solid #ff4d4f;border-radius:4px;background:#fff;color:#ff4d4f;font-size:12px;cursor:pointer;">删除</button>
        </div>
      </div>`
    }).join('')
  }

  function getModalHTML() {
    const domain = editingDomain || location.hostname
    return `
<div id="web-hotkey-overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="background:#fff;border-radius:12px;width:520px;max-width:94vw;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #eee;font-size:16px;font-weight:600;">
      <span>🔧 改键配置</span>
      <span id="whk-close-btn" style="cursor:pointer;font-size:22px;color:#999;line-height:1;">&times;</span>
    </div>
    <div style="padding:16px 20px 0;">
      <label style="font-size:13px;color:#666;display:block;margin-bottom:4px;">域名</label>
      <input id="whk-domain-input" type="text" value="${escapeHtml(domain)}" placeholder="example.com" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;box-sizing:border-box;">
    </div>
    <div style="padding:12px 20px 4px;font-size:13px;color:#666;">改键规则</div>
    <div id="whk-rule-list" style="padding:0 20px;overflow-y:auto;flex:1;min-height:100px;"></div>
    <div style="padding:8px 20px;">
      <button id="whk-add-rule-btn" style="width:100%;padding:8px;border:1px dashed #ccc;border-radius:6px;background:#fafafa;color:#666;font-size:13px;cursor:pointer;">+ 新增规则</button>
    </div>
    <div style="padding:8px 20px 4px;font-size:12px;color:#999;">
      <label><input type="checkbox" id="whk-skip-inputs" ${currentConfig.skipInputs !== false ? 'checked' : ''}> 在输入框/文本域中禁用改键</label>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;padding:12px 20px;border-top:1px solid #eee;">
      <button id="whk-cancel-btn" style="padding:8px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:14px;cursor:pointer;">取消</button>
      <button id="whk-save-btn" style="padding:8px 20px;border:none;border-radius:6px;background:#1677ff;color:#fff;font-size:14px;cursor:pointer;">保存</button>
    </div>
  </div>
</div>`
  }

  function openPanel() {
    currentConfig = loadConfig()
    editingDomain = location.hostname
    document.body.insertAdjacentHTML('beforeend', getModalHTML())
    bindPanelEvents()
  }

  function closePanel() {
    const overlay = document.getElementById('web-hotkey-overlay')
    if (overlay) overlay.remove()
  }

  function bindPanelEvents() {
    const overlay = document.getElementById('web-hotkey-overlay')
    if (!overlay) return

    const domainInput = document.getElementById('whk-domain-input')
    const ruleList = document.getElementById('whk-rule-list')

    renderRuleList(ruleList, currentConfig.rules, editingDomain)

    domainInput.addEventListener('input', () => {
      editingDomain = domainInput.value.trim()
      renderRuleList(ruleList, currentConfig.rules, editingDomain)
    })

    document.getElementById('whk-close-btn').onclick = closePanel
    document.getElementById('whk-cancel-btn').onclick = closePanel

    document.getElementById('whk-add-rule-btn').onclick = () => {
      openRuleEditor(null)
    }

    ruleList.addEventListener('click', (e) => {
      const btn = e.target.closest('button')
      if (!btn) return
      const ruleIdx = parseInt(btn.dataset.ruleIdx)
      const filtered = currentConfig.rules.filter(r => r.domain === editingDomain)
      const globalIdx = currentConfig.rules.indexOf(filtered[ruleIdx])
      if (btn.classList.contains('whk-edit-btn')) {
        openRuleEditor(globalIdx)
      } else if (btn.classList.contains('whk-del-btn')) {
        currentConfig.rules.splice(globalIdx, 1)
        renderRuleList(ruleList, currentConfig.rules, editingDomain)
      }
    })

    document.getElementById('whk-save-btn').onclick = () => {
      const skipInputs = document.getElementById('whk-skip-inputs').checked
      currentConfig.skipInputs = skipInputs
      saveConfig(currentConfig)
      closePanel()
    }

    ruleList.addEventListener('mouseover', (e) => {
      const btn = e.target.closest('button')
      if (!btn) return
      if (btn.classList.contains('whk-del-btn')) {
        btn.style.background = '#ff4d4f'
        btn.style.color = '#fff'
      }
    })
    ruleList.addEventListener('mouseout', (e) => {
      const btn = e.target.closest('button')
      if (!btn) return
      if (btn.classList.contains('whk-del-btn')) {
        btn.style.background = '#fff'
        btn.style.color = '#ff4d4f'
      }
    })
  }

  function modBtnHTML(prefix, mod, active) {
    const label = mod === 'meta' ? '△' : mod.charAt(0).toUpperCase() + mod.slice(1)
    const borderColor = active ? '#1677ff' : '#ddd'
    const bg = active ? '#e6f4ff' : '#fff'
    const color = active ? '#1677ff' : '#333'
    return `<button data-prefix="${prefix}" data-mod="${mod}" class="whk-mod-btn" style="padding:6px 12px;border:1px solid ${borderColor};border-radius:4px;background:${bg};color:${color};font-size:12px;cursor:pointer;">${label}</button>`
  }

  function keyInputHTML(prefix, key) {
    return `<input data-prefix="${prefix}" class="whk-key-input" type="text" value="${escapeHtml(key)}" placeholder="按键" readonly style="width:60px;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:12px;text-align:center;cursor:text;">`
  }

  function openRuleEditor(editGlobalIdx) {
    const existing = editGlobalIdx != null ? currentConfig.rules[editGlobalIdx] : null
    const srcMod = existing ? { ...existing.source } : { key: '', ctrl: false, alt: false, shift: false, meta: false }
    const tgtMod = existing ? { ...existing.target } : { key: '', ctrl: false, alt: false, shift: false, meta: false }
    const ruleDomain = existing ? existing.domain : editingDomain

    const editorHTML = `
<div id="whk-editor-overlay" style="position:absolute;top:0;left:0;right:0;bottom:0;z-index:10;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;border-radius:12px;">
  <div style="background:#fff;border-radius:10px;width:380px;padding:20px;box-shadow:0 4px 24px rgba(0,0,0,0.25);">
    <div style="font-size:15px;font-weight:600;margin-bottom:16px;">${existing ? '编辑改键规则' : '新增改键规则'}</div>
    <div style="margin-bottom:12px;">
      <div style="font-size:12px;color:#666;margin-bottom:6px;">按下</div>
      <div class="whk-key-row" style="display:flex;gap:4px;flex-wrap:wrap;">
        ${modBtnHTML('src', 'ctrl', srcMod.ctrl)}
        ${modBtnHTML('src', 'alt', srcMod.alt)}
        ${modBtnHTML('src', 'shift', srcMod.shift)}
        ${modBtnHTML('src', 'meta', srcMod.meta)}
        ${keyInputHTML('src', srcMod.key)}
      </div>
    </div>
    <div style="margin-bottom:16px;">
      <div style="font-size:12px;color:#666;margin-bottom:6px;">改为</div>
      <div class="whk-key-row" style="display:flex;gap:4px;flex-wrap:wrap;">
        ${modBtnHTML('tgt', 'ctrl', tgtMod.ctrl)}
        ${modBtnHTML('tgt', 'alt', tgtMod.alt)}
        ${modBtnHTML('tgt', 'shift', tgtMod.shift)}
        ${modBtnHTML('tgt', 'meta', tgtMod.meta)}
        ${keyInputHTML('tgt', tgtMod.key)}
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;">
      <button id="whk-editor-cancel" style="padding:7px 18px;border:1px solid #ddd;border-radius:5px;background:#fff;font-size:13px;cursor:pointer;">取消</button>
      <button id="whk-editor-ok" style="padding:7px 18px;border:none;border-radius:5px;background:#1677ff;color:#fff;font-size:13px;cursor:pointer;">确定</button>
    </div>
  </div>
</div>`

    const overlay = document.getElementById('web-hotkey-overlay')
    overlay.insertAdjacentHTML('beforeend', editorHTML)

    document.querySelectorAll('.whk-mod-btn').forEach(btn => {
      btn.onclick = () => {
        const prefix = btn.dataset.prefix
        const mod = btn.dataset.mod
        const modObj = prefix === 'src' ? srcMod : tgtMod
        modObj[mod] = !modObj[mod]
        btn.style.borderColor = modObj[mod] ? '#1677ff' : '#ddd'
        btn.style.background = modObj[mod] ? '#e6f4ff' : '#fff'
        btn.style.color = modObj[mod] ? '#1677ff' : '#333'
      }
    })

    document.querySelectorAll('.whk-key-input').forEach(inp => {
      inp.addEventListener('focus', function () {
        this.value = ''
        this.dataset.capturing = 'true'
        this.style.borderColor = '#1677ff'
      })
      inp.addEventListener('blur', function () {
        this.dataset.capturing = 'false'
        this.style.borderColor = '#ddd'
      })
    })

    const keyHandler = (e) => {
      const active = document.activeElement
      if (!active || !active.classList.contains('whk-key-input') || active.dataset.capturing !== 'true') return
      e.preventDefault()
      e.stopPropagation()
      const prefix = active.dataset.prefix
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase()
      if (key === 'control' || key === 'alt' || key === 'shift' || key === 'meta') return
      const displayKey = key === ' ' ? 'space' : key
      active.value = displayKey
      active.dataset.capturing = 'false'
      const modObj = prefix === 'src' ? srcMod : tgtMod
      modObj.key = displayKey
      active.blur()
    }
    document.addEventListener('keydown', keyHandler)

    document.getElementById('whk-editor-cancel').onclick = () => {
      document.getElementById('whk-editor-overlay').remove()
      document.removeEventListener('keydown', keyHandler)
    }

    document.getElementById('whk-editor-ok').onclick = () => {
      if (!srcMod.key || !tgtMod.key) {
        alert('请设置源按键和目标按键')
        return
      }

      if (editGlobalIdx == null) {
        const conflict = currentConfig.rules.find(r =>
          r.domain === ruleDomain &&
          r.source.key === srcMod.key &&
          r.source.ctrl === srcMod.ctrl &&
          r.source.alt === srcMod.alt &&
          r.source.shift === srcMod.shift &&
          r.source.meta === srcMod.meta
        )
        if (conflict) {
          alert('该按键组合在此域名下已存在规则')
          return
        }
      }

      const newRule = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), domain: ruleDomain, source: { ...srcMod }, target: { ...tgtMod } }
      if (editGlobalIdx != null) {
        currentConfig.rules[editGlobalIdx] = newRule
      } else {
        currentConfig.rules.push(newRule)
      }

      document.getElementById('whk-editor-overlay').remove()
      document.removeEventListener('keydown', keyHandler)

      const ruleList = document.getElementById('whk-rule-list')
      if (ruleList) renderRuleList(ruleList, currentConfig.rules, editingDomain)
    }
  }

  const MODIFIER_KEYS = new Set(['control', 'alt', 'shift', 'meta'])

  function matchRule(config, domain, key, ctrl, alt, shift, meta) {
    for (const rule of config.rules) {
      if (rule.domain !== domain) continue
      const s = rule.source
      if (s.key !== key) continue
      if (!!s.ctrl !== ctrl) continue
      if (!!s.alt !== alt) continue
      if (!!s.shift !== shift) continue
      if (!!s.meta !== meta) continue
      return rule
    }
    return null
  }

  function dispatchRemapped(originalEvent, targetMod) {
    const target = originalEvent.target

    const modEvents = []
    if (targetMod.ctrl) modEvents.push({ key: 'Control', code: 'ControlLeft', ctrlKey: true })
    if (targetMod.alt) modEvents.push({ key: 'Alt', code: 'AltLeft', altKey: true })
    if (targetMod.shift) modEvents.push({ key: 'Shift', code: 'ShiftLeft', shiftKey: true })
    if (targetMod.meta) modEvents.push({ key: 'Meta', code: 'MetaLeft', metaKey: true })

    for (const m of modEvents) {
      target.dispatchEvent(new KeyboardEvent('keydown', {
        key: m.key, code: m.code, ctrlKey: !!targetMod.ctrl, altKey: !!targetMod.alt,
        shiftKey: !!targetMod.shift, metaKey: !!targetMod.meta,
        bubbles: true, cancelable: true
      }))
    }

    target.dispatchEvent(new KeyboardEvent('keydown', {
      key: targetMod.key,
      code: targetMod.key.length === 1 ? 'Key' + targetMod.key.toUpperCase() : targetMod.key,
      ctrlKey: targetMod.ctrl, altKey: targetMod.alt,
      shiftKey: targetMod.shift, metaKey: targetMod.meta,
      bubbles: true, cancelable: true
    }))
  }

  document.addEventListener('keydown', (e) => {
    if (document.getElementById('web-hotkey-overlay')) return
    if (MODIFIER_KEYS.has(e.key)) return
    if (e.isComposing || e.keyCode === 229) return

    const config = loadConfig()

    const tag = e.target.tagName
    if (config.skipInputs !== false && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return

    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase()
    const domain = location.hostname

    const rule = matchRule(config, domain, key, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey)
    if (!rule) return

    e.preventDefault()
    e.stopPropagation()
    dispatchRemapped(e, rule.target)
  }, true)

  GM_registerMenuCommand('改键配置', openPanel, 'c')
})()
