const PRIVATE_HOST_PATTERNS = [
  /mail\./i,
  /webmail/i,
  /outlook\./i,
  /banking/i,
  /bank\./i,
  /paypal\./i,
  /checkout/i,
  /payment/i,
  /accounts?\.google/i,
  /login\./i,
  /signin\./i,
  /health/i,
  /medical/i,
  /hospital/i,
]

const PRIVATE_PATH_PATTERNS = [
  /\/login/i,
  /\/signin/i,
  /\/signup/i,
  /\/checkout/i,
  /\/payment/i,
  /\/billing/i,
  /\/account\/settings/i,
  /\/cart/i,
]

export function detectPrivatePage(url: URL): { private: boolean; reason?: string } {
  if (PRIVATE_HOST_PATTERNS.some((re) => re.test(url.hostname))) {
    return { private: true, reason: 'sensitive_host' }
  }
  if (PRIVATE_PATH_PATTERNS.some((re) => re.test(url.pathname))) {
    return { private: true, reason: 'auth_or_checkout_path' }
  }

  const password = document.querySelector('input[type="password"]')
  if (password) return { private: true, reason: 'password_field' }

  const loginForm = document.querySelector(
    'form[action*="login" i], form[action*="signin" i], form#login, form.login',
  )
  if (loginForm) return { private: true, reason: 'login_form' }

  const inputs = document.querySelectorAll('input, textarea, select')
  const visibleInputs = [...inputs].filter((el) => {
    const style = getComputedStyle(el)
    return style.display !== 'none' && style.visibility !== 'hidden'
  })
  if (visibleInputs.length >= 6 && document.body.innerText.trim().length < 800) {
    return { private: true, reason: 'form_heavy' }
  }

  if (document.querySelector('[role="textbox"][contenteditable="true"]') && /chat|mail|inbox/i.test(url.href)) {
    return { private: true, reason: 'chat_or_mail' }
  }

  return { private: false }
}
