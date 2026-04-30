import * as XLSX from 'xlsx'

/**
 * Export an array of objects to .xlsx and trigger a browser download.
 * @param {Array<Object>} rows  - rows already shaped for output
 * @param {string[]}      headers - ordered list of column headers (also keys in each row)
 * @param {string}        filename
 * @param {string}        sheetName
 */
export function exportToXlsx(rows, headers, filename, sheetName = 'Sheet1') {
    const ws = XLSX.utils.json_to_sheet(rows, { header: headers })
    // Auto column widths based on content length
    ws['!cols'] = headers.map(h => {
        const longest = Math.max(
            h.length,
            ...rows.map(r => String(r[h] ?? '').length)
        )
        return { wch: Math.min(60, longest + 2) }
    })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, filename)
}

/**
 * Read an .xlsx/.xls/.csv file and return rows as objects with normalised keys.
 * Header matching is case- and whitespace-insensitive against the keys of `columnMap`.
 *
 * @param {File}                            file
 * @param {Record<string, string|string[]>} columnMap
 *   keys = canonical field names returned in each row,
 *   values = a single string OR array of acceptable header aliases (case-insensitive).
 *   Example: { project: ['Project', 'Project Name'], date: 'Date' }
 *
 * @returns {Promise<Array<Object>>}
 */
export function importFromXlsx(file, columnMap) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result)
                const wb = XLSX.read(data, { type: 'array', cellDates: true })
                const ws = wb.Sheets[wb.SheetNames[0]]
                if (!ws) return resolve([])
                const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false })

                // Build normalised header lookup: aliasLower -> canonicalKey
                const aliasLookup = {}
                for (const [key, aliases] of Object.entries(columnMap)) {
                    const arr = Array.isArray(aliases) ? aliases : [aliases]
                    for (const a of arr) {
                        aliasLookup[String(a).trim().toLowerCase()] = key
                    }
                }

                const rows = raw.map(row => {
                    const out = {}
                    for (const [orig, val] of Object.entries(row)) {
                        const k = aliasLookup[String(orig).trim().toLowerCase()]
                        if (k) out[k] = val
                    }
                    return out
                })
                resolve(rows)
            } catch (err) {
                reject(err)
            }
        }
        reader.readAsArrayBuffer(file)
    })
}

/** Convert a duration string to minutes. Accepts "HH:MM", "1.5", "90". Returns null if invalid. */
export function parseDurationMins(v) {
    if (v == null || v === '') return null
    const s = String(v).trim()
    if (s.includes(':')) {
        const [h, m] = s.split(':').map(x => parseInt(x, 10))
        if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m
        return null
    }
    const n = Number(s)
    if (!Number.isFinite(n)) return null
    // Heuristic: small numbers (<= 24) are hours; larger are minutes.
    return n <= 24 ? Math.round(n * 60) : Math.round(n)
}

/** ISO date string YYYY-MM-DD from a Date or string. */
export function toIsoDate(v) {
    if (!v) return ''
    if (v instanceof Date && !isNaN(v)) {
        const y = v.getFullYear()
        const m = String(v.getMonth() + 1).padStart(2, '0')
        const d = String(v.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
    }
    const d = new Date(v)
    if (isNaN(d)) return String(v)
    return toIsoDate(d)
}

/** "M/D/YYYY" date string used by Tasks page. */
export function toMDY(v) {
    if (!v) return ''
    const d = v instanceof Date ? v : new Date(v)
    if (isNaN(d)) return String(v)
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

/** Convert minutes to "H:MM" label */
export function minsToLabel(m) {
    if (m == null) return ''
    const h = Math.floor(m / 60)
    const min = m % 60
    return `${h}:${String(min).padStart(2, '0')}`
}
