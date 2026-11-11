(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var form = $('login-form');
  var email = $('email');
  var password = $('password');
  var emailError = $('email-error');
  var passwordError = $('password-error');
  var capsHint = $('caps-hint');
  var alertBox = $('alert');
  var submit = $('submit');
  var submitLabel = $('submit-label');
  var toggle = $('toggle-pwd');
  var forgot = $('forgot');
  var remember = $('remember');
  var vis = $('vis');
  var stateText = $('state-text');

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // ---------------------------------------------------------------
  // AUTENTICAÇÃO (SIMULADA)
  // Trocar pelo cliente real do backend quando ele existir.
  // Contrato: resolve({ ok: true }) ou reject({ code, message }).
  // Acesso de teste enquanto não há backend: demo@hunter.test / hunter123
  // ---------------------------------------------------------------
  function signIn(credentials) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (credentials.email.toLowerCase() === 'demo@hunter.test' && credentials.password === 'hunter123') {
          resolve({ ok: true });
        } else {
          reject({ code: 'invalid_credentials', message: 'E-mail ou senha incorretos. Confira e tente de novo.' });
        }
      }, 900);
    });
  }

  // ---------- O lobo fecha os olhos enquanto a senha está oculta ----------
  function syncWolf() {
    var hiding = document.activeElement === password && password.type === 'password';
    vis.classList.toggle('shut', hiding);
    stateText.textContent = hiding ? 'Ele não olha a sua senha' : 'De olho na sua rede';
  }

  // ---------- Validação ----------
  function setFieldError(input, errorEl, message) {
    errorEl.textContent = message || '';
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function validateEmail() {
    var value = email.value.trim();
    if (!value) { setFieldError(email, emailError, 'Informe seu e-mail.'); return false; }
    if (!EMAIL_RE.test(value)) { setFieldError(email, emailError, 'Esse e-mail não parece válido.'); return false; }
    setFieldError(email, emailError, '');
    return true;
  }

  function validatePassword() {
    if (!password.value) { setFieldError(password, passwordError, 'Informe sua senha.'); return false; }
    setFieldError(password, passwordError, '');
    return true;
  }

  // ---------- Avisos ----------
  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.classList.toggle('ok', type === 'ok');
    alertBox.classList.add('show');
  }

  function hideAlert() {
    alertBox.textContent = '';
    alertBox.classList.remove('show', 'ok');
  }

  function setLoading(isLoading) {
    submit.disabled = isLoading;
    submit.classList.toggle('loading', isLoading);
    submit.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    submitLabel.textContent = isLoading ? 'Entrando…' : 'Entrar';
  }

  // ---------- Eventos ----------
  email.addEventListener('blur', function () { if (email.value) validateEmail(); });
  email.addEventListener('input', function () { if (email.hasAttribute('aria-invalid')) validateEmail(); });
  password.addEventListener('input', function () { if (password.hasAttribute('aria-invalid')) validatePassword(); });

  password.addEventListener('focus', syncWolf);
  password.addEventListener('blur', function () {
    capsHint.hidden = true;
    syncWolf();
  });

  function checkCaps(e) {
    if (typeof e.getModifierState === 'function') {
      capsHint.hidden = !e.getModifierState('CapsLock');
    }
  }
  password.addEventListener('keydown', checkCaps);
  password.addEventListener('keyup', checkCaps);

  // mousedown com preventDefault mantém o foco (e o teclado do celular) no campo
  toggle.addEventListener('mousedown', function (e) { e.preventDefault(); });
  toggle.addEventListener('click', function () {
    var show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    toggle.textContent = show ? 'Ocultar' : 'Mostrar';
    toggle.setAttribute('aria-pressed', show ? 'true' : 'false');
    syncWolf();
  });

  forgot.addEventListener('click', function (e) {
    e.preventDefault();
    showAlert('A recuperação de senha ainda não está disponível. Fale com o suporte da Devmais.', 'ok');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submit.disabled) return;
    hideAlert();

    var emailOk = validateEmail();
    var passwordOk = validatePassword();
    if (!emailOk || !passwordOk) {
      (emailOk ? password : email).focus();
      return;
    }

    setLoading(true);
    signIn({
      email: email.value.trim(),
      password: password.value,
      remember: remember.checked
    }).then(function () {
      setLoading(false);
      showAlert('Tudo certo, você entrou. O painel ainda está em construção.', 'ok');
    }).catch(function (err) {
      setLoading(false);
      showAlert((err && err.message) || 'Não foi possível entrar agora. Tente de novo em instantes.');
      password.value = '';
      password.focus();
    });
  });
})();
