<script>
	import { goto } from '$app/navigation';
	import { setUser } from '$lib/assets/user.svelte.js';
	import { _ } from 'svelte-i18n';

	let username = $state('');
	let email = $state('');
	let password = $state('');
	let passwordConfirm = $state('');
	let errorMsg = $state('');
	let loading = $state(false);

	async function handleRegister() {
		errorMsg = '';
		if (!username || !email || !password || !passwordConfirm) { errorMsg = $_('register.error_fields'); return; }
		if (password !== passwordConfirm) { errorMsg = $_('register.error_match'); return; }
		if (password.length < 6) { errorMsg = $_('register.error_length'); return; }

		loading = true;
		try {
			const res = await fetch('http://localhost:3000/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, password })
			});
			const data = await res.json();
			if (!res.ok) { errorMsg = data.error || $_('register.error_server'); return; }

			const loginRes = await fetch('http://localhost:3000/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			const loginData = await loginRes.json();
			if (!loginRes.ok) { errorMsg = loginData.error || $_('register.error_server'); return; }
			setUser(loginData.user);
			localStorage.setItem('token', loginData.token); //help with ai
			goto('/');
		} catch {
			errorMsg = $_('register.error_server');
		} finally {
			loading = false;
		}
	}
</script>

<div class="page">
	<div class="card">
		<h1 class="app-name">SchnellVerkauft</h1>
		<h2 class="form-title">{$_('register.title')}</h2>

		{#if errorMsg}<div class="error-box">{errorMsg}</div>{/if}

		<div class="form-group">
			<label for="username">{$_('register.username')}</label>
			<input id="username" type="text" placeholder={$_('register.placeholder_username')} bind:value={username} />
		</div>
		<div class="form-group">
			<label for="email">{$_('register.email')}</label>
			<input id="email" type="email" placeholder={$_('register.placeholder_email')} bind:value={email} />
		</div>
		<div class="form-group">
			<label for="password">{$_('register.password')}</label>
			<input id="password" type="password" placeholder={$_('register.placeholder_pw')} bind:value={password} />
		</div>
		<div class="form-group">
			<label for="passwordConfirm">{$_('register.confirm')}</label>
			<input id="passwordConfirm" type="password" placeholder={$_('register.placeholder_confirm')} bind:value={passwordConfirm} />
		</div>

		<button class="btn-primary" onclick={handleRegister} disabled={loading}>
			{loading ? $_('register.loading') : $_('register.btn')}
		</button>

		<p class="switch-link">
			{$_('register.has_account')} <a href="/login">{$_('register.login')}</a>
		</p>
	</div>
</div>

<style>
	.page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f0f2f5}
	.card{background:#fff;border-radius:10px;padding:2.5rem 2rem;width:100%;max-width:400px;box-shadow:0 2px 16px rgba(0,0,0,.1)}
	.app-name{font-size:1.6rem;font-weight:700;color:#1a1a1a;margin-bottom:.25rem}
	.form-title{font-size:1rem;font-weight:400;color:#555;margin-bottom:1.5rem}
	.error-box{background:#fdecea;color:#c0392b;border-radius:6px;padding:.6rem .9rem;font-size:.875rem;margin-bottom:1rem}
	.form-group{margin-bottom:1rem}
	.form-group label{display:block;font-size:.875rem;color:#333;margin-bottom:.35rem}
	.form-group input{width:100%;padding:.6rem .75rem;border:1px solid #ccc;border-radius:6px;font-size:.9rem;background:#f5f5f5;color:#1a1a1a;box-sizing:border-box;transition:border-color .15s}
	.form-group input:focus{outline:none;border-color:#2d3a9e;background:#fff}
	.btn-primary{width:100%;padding:.7rem;background:#2d3a9e;color:#fff;border:none;border-radius:6px;font-size:1rem;font-weight:600;cursor:pointer;margin-top:.5rem;transition:background .15s}
	.btn-primary:hover:not(:disabled){background:#1e2b80}
	.btn-primary:disabled{opacity:.6;cursor:not-allowed}
	.switch-link{text-align:center;margin-top:1rem;font-size:.875rem;color:#555}
	.switch-link a{color:#2d3a9e;font-weight:600;text-decoration:none}
	.switch-link a:hover{text-decoration:underline}
</style>
