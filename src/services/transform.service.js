class DataTransformer {
  // Comma-separated string to JSON array string (for NocoDB storage)
  commaToArray(input) {
    if (!input) return '[]';
    const items = input.split(',').map(s => s.trim()).filter(Boolean);
    return JSON.stringify(items);
  }

  // Newline-separated string to JSON array string (for NocoDB storage)
  newlineToArray(input) {
    if (!input) return '[]';
    const items = input.split('\n').map(s => s.trim()).filter(Boolean);
    return JSON.stringify(items);
  }

  // JSON array string to comma-separated (for display)
  arrayToComma(jsonStr) {
    try {
      const arr = JSON.parse(jsonStr || '[]');
      if (!Array.isArray(arr)) return '';
      return arr.join(', ');
    } catch {
      return '';
    }
  }

  // JSON array string to newline-separated (for display)
  arrayToNewline(jsonStr) {
    try {
      const arr = JSON.parse(jsonStr || '[]');
      if (!Array.isArray(arr)) return '';
      return arr.join('\n');
    } catch {
      return '';
    }
  }

  // Parse JSON safely
  parseJsonSafe(jsonStr, defaultValue = []) {
    try {
      return JSON.parse(jsonStr || JSON.stringify(defaultValue));
    } catch {
      return defaultValue;
    }
  }
}

module.exports = new DataTransformer();
