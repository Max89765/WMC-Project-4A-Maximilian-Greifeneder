<script>
	import { goto } from '$app/navigation';
	import { getUser, clearUser } from '$lib/assets/user.svelte.js';

	const CATEGORIES = ['Kleidung', 'Elektronik', 'Sport', 'Auto', 'Wohnen', 'Sonstiges'];

	function handleLogout() {
		localStorage.removeItem('token');
		clearUser();
		goto('/login');
	}

	let user = $derived(getUser());
</script>

<nav class="bg-[#2d3a9e] text-white px-6 py-3 flex items-center justify-between shadow-md">
	<a href="/" class="text-xl font-bold tracking-tight hover:opacity-90">
		SchnellVerkauft
	</a>

	<div class="flex items-center gap-4">
		{#if user}
			<a
				href="/listings/new"
				class="bg-white text-[#2d3a9e] font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-gray-100 transition"
			>
				+ Anzeige erstellen
			</a>
			<a href="/chat" class="text-sm hover:opacity-80">Chats</a>
			<a href="/profile" class="text-sm hover:opacity-80">
				<div class="w-8 h-8 rounded-full bg-white text-[#2d3a9e] font-bold flex items-center justify-center text-xs">
					{user.username?.[0]?.toUpperCase() ?? '?'}
				</div>
			</a>
			<button onclick={handleLogout} class="text-xs text-white/70 hover:text-white">
				Logout
			</button>
		{:else}
			<a href="/login" class="text-sm hover:opacity-80">Anmelden</a>
			<a
				href="/register"
				class="bg-white text-[#2d3a9e] font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-gray-100 transition"
			>
				Registrieren
			</a>
		{/if}
	</div>
</nav>
