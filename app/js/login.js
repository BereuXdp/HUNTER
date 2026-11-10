(function () {
  'use strict';

  var form = document.getElementById('login-form');
  var email = document.getElementById('email');
  var password = document.getElementById('password');
  var emailError = document.getElementById('email-error');
  var passwordError = document.getElementById('password-error');
  var alertBox = document.getElementById('alert');
  var submit = document.getElementById('submit');
  var submitLabel = document.getElementById('submit-label');
  var toggle = document.getElementById('toggle-pwd');
  var forgot = document.getElementById('forgot');

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // ---------------------------------------------------------------
  // AUTENTICAÇÃO (SIMULADA)
  // Substituir pelo cliente real do backend quando ele existir.
  // Contrato esperado: resolve({ ok: true }) ou reject({ code, message }).
  // Credenciais de teste enquanto não há backend: demo@hunter.test / hunter123
  // ---------------------------------------------------------------
  function signIn(credentials) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (credentials.email === 'demo@hunter.test' && credentials.password === 'hunter123') {
          resolve({ ok: true });
        } else {
          reject({ code: 'invalid_credentials', message: 'E-mail ou senha incorretos.' });
        }
      }, 800);
    });
  }

  function setFieldError(input, errorEl, message) {
    errorEl.textContent = message || '';
    if (message) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  function validateEmail() {
    var value = email.value.trim();
    if (!value) {
      setFieldError(email, emailError, 'Informe seu e-mail.');
      return false;
    }
    if (!EMAIL_RE.test(value)) {
      setFieldError(email, emailError, 'Esse e-mail não parece válido.');
      return false;
    }
    setFieldError(email, emailError, '');
    return true;
  }

  function validatePassword() {
    if (!password.value) {
      setFieldError(password, passwordError, 'Informe sua senha.');
      return false;
    }
    setFieldError(password, passwordError, '');
    return true;
  }

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
    submitLabel.textContent = isLoading ? 'Entrando…' : 'Entrar';
    submit.setAttribute('aria-busy', isLoading ? 'true' : 'false');
  }

  email.addEventListener('blur', function () {
    if (email.value) validateEmail();
  });
  password.addEventListener('blur', function () {
    if (password.value) validatePassword();
  });
  email.addEventListener('input', function () {
    if (email.getAttribute('aria-invalid')) validateEmail();
  });
  password.addEventListener('input', function () {
    if (password.getAttribute('aria-invalid')) validatePassword();
  });

  toggle.addEventListener('click', function () {
    var show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    toggle.textContent = show ? 'Ocultar' : 'Mostrar';
    toggle.setAttribute('aria-pressed', show ? 'true' : 'false');
  });

  forgot.addEventListener('click', function (e) {
    e.preventDefault();
    showAlert('A recuperação de senha ainda não está disponível. Fale com o suporte.');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
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
      remember: document.getElementById('remember').checked
    }).then(function () {
      setLoading(false);
      showAlert('Login realizado. O painel ainda está em construção.', 'ok');
      password.value = '';
    }).catch(function (err) {
      setLoading(false);
      showAlert((err && err.message) || 'Não foi possível entrar. Tente de novo.');
      password.value = '';
      password.focus();
    });
  });
})();
