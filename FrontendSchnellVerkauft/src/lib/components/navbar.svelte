<script>
	import { goto } from '$app/navigation';
	import { getUser, clearUser, getUnreadCount, setUnreadCount, incrementUnread } from '$lib/assets/user.svelte.js';
	import { io } from 'socket.io-client';
	import { onDestroy } from 'svelte';
	import { page } from '$app/stores';

	function handleLogout() {
		localStorage.removeItem('token');
		clearUser();
		goto('/login');
	}

	let user = $derived(getUser());
	let unread = $derived(getUnreadCount());

	// Socket nur verbinden wenn eingeloggt, um unread-Badge live zu aktualisieren // help with ai
	let socket = null;

	$effect(() => {//AI
        if (!user) return;

        socket = io('http://localhost:3000');

        socket.emit('identify', user.id);

        const token = localStorage.getItem('token');
        fetch('http://localhost:3000/api/conversations/unread-count', {
            headers: { 'Authorization': `Bearer ${token}` }
        }) 
        .then(r => r.json())
        .then(d => setUnreadCount(d.count ?? 0))
        .catch(() => {});
        
        
        socket.on('unread-notification', () => { 
            incrementUnread();
            console.log("Neues Unread!");
        });

        return () => {
            socket?.disconnect();
        };
    });
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

			<!-- Chats-Link mit Unread-Badge -->
			<a
				href="/chat"
				onclick={() => setUnreadCount(0)}
				class="text-sm hover:opacity-80 relative"
			>
				Chats
				{#if unread > 0}
					<span class="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
						{unread}
					</span>
				{/if}
			</a>

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
