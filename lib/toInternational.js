// lib/toInternational.js
export function toInternational(phone) {
    // 이미 국제번호면 그대로
    if (phone.startsWith('+')) return phone;
    // 한국 휴대폰번호 (010/011/016/017/018/019)
    if (/^01[016789]/.test(phone) && phone.length === 11) {
      return '+82' + phone.slice(1); // 01012345678 → +821012345678
    }
    return phone;
  }
  