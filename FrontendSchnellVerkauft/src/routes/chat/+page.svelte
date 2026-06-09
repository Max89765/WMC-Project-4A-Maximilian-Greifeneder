<script>
	import { page } from '$app/stores';
	import { onDestroy } from 'svelte';
	import { getUser } from '$lib/assets/user.svelte.js';
    import { setUser } from '$lib/assets/user.svelte.js';
	import { io } from 'socket.io-client';

	let user = $derived(getUser());

	let conversations = $state([]);
	let activeConversation = $state(null);
	let messages = $state([]);
	let messageText = $state('');
	let searchQuery = $state('');
	let loading = $state(true);

	// Socket.IO verbinden // help with ai
	const socket = io('http://localhost:3000');

	socket.on('new-message', (msg) => { // help with ai
		if (activeConversation && msg.conversation_id === activeConversation.id) {
			messages = [...messages, msg];
		}
		// Konversationsliste aktualisieren
		conversations = conversations.map(c =>
			c.id === msg.conversation_id
				? { ...c, last_message: msg.content, last_time: msg.created_at }
				: c
		);
	});

	onDestroy(() => socket.disconnect());

	// Konversationen laden
	async function fetchConversations() {
		const token = localStorage.getItem('token');
		try {
			const res = await fetch('http://localhost:3000/api/conversations', {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			conversations = await res.json();

			// Falls ?conversation=id in URL, direkt öffnen
			const urlConvId = $page.url.searchParams.get('conversation');
			if (urlConvId) {
				const conv = conversations.find(c => c.id === Number(urlConvId));
				if (conv) openConversation(conv);
			}
		} finally {
			loading = false;
		}
	}

	// Nachrichten einer Konversation laden
	async function openConversation(conv) {
		activeConversation = conv;
		const token = localStorage.getItem('token');
		const res = await fetch(`http://localhost:3000/api/conversations/${conv.id}/messages`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		messages = await res.json();
		socket.emit('join-conversation', conv.id); // help with ai
	}

	// Nachricht senden
	async function sendMessage() {
		if (!messageText.trim() || !activeConversation) return;
		const token = localStorage.getItem('token');
		const content = messageText;
		messageText = '';

		await fetch(`http://localhost:3000/api/conversations/${activeConversation.id}/messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify({ content })
		});
	}

	function handleKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	function formatTime(dt) {
		if (!dt) return '';
		return new Date(dt).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
	}

	let filteredConversations = $derived(
		conversations.filter(c =>
			c.other_username?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	$effect(() => {
        async function init() {
            const token = localStorage.getItem('token');
            
            // Wenn ein Token da ist, aber der User noch nicht im State liegt:
            if (token && !getUser()) {
                try {
                    const res = await fetch('http://localhost:3000/api/auth/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setUser(data.user); // State wiederherstellen!
                    } else {
                        // Token abgelaufen oder ungültig
                        localStorage.removeItem('token');
                    }
                } catch (err) {
                    console.error('Fehler beim Laden des Users', err);
                }
            }
            // Danach erst die Konversationen laden
            fetchConversations();
        }
    
        init();
    });
</script>

<!-- Blue header bar wie im Mockup -->
<div class="bg-[#2d3a9e] px-6 py-3">
	<span class="text-white font-semibold text-base">Chats</span>
</div>

<div class="flex h-[calc(100vh-112px)] bg-gray-100">

	<!-- Linke Spalte: Konversationsliste (wie Mockup) -->
	<div class="w-80 shrink-0 bg-white border border-gray-200 rounded-xl m-4 mr-2 flex flex-col overflow-hidden">

		<!-- Suchleiste -->
		<div class="p-3 border-b border-gray-100">
			<div class="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
				<span class="text-gray-400 text-sm">🔍</span>
				<input
					type="text"
					placeholder="Search"
					bind:value={searchQuery}
					class="flex-1 text-sm outline-none bg-transparent"
				/>
			</div>
		</div>

		<!-- Konversationen -->
		<div class="flex-1 overflow-y-auto">
			{#if loading}
				{#each Array(5) as _}
					<div class="flex items-center gap-3 px-4 py-3 animate-pulse">
						<div class="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
						<div class="flex-1 space-y-1">
							<div class="h-3 bg-gray-200 rounded w-1/2"></div>
							<div class="h-3 bg-gray-200 rounded w-3/4"></div>
						</div>
					</div>
				{/each}
			{:else if filteredConversations.length === 0}
				<p class="text-center text-gray-400 text-sm py-8">Keine Chats</p>
			{:else}
				{#each filteredConversations as conv}
					<button
						onclick={() => openConversation(conv)}
						class="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition text-left
							{activeConversation?.id === conv.id ? 'bg-gray-50' : ''}"
					>
						<!-- Avatar -->
						<div class="w-10 h-10 rounded-full bg-[#2d3a9e] flex items-center justify-center text-white font-bold text-sm shrink-0">
							{conv.other_username?.[0]?.toUpperCase() ?? '?'}
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex justify-between items-center">
								<span class="text-sm font-semibold text-gray-800 truncate">{conv.other_username}</span>
								<span class="text-xs text-gray-400 shrink-0 ml-2">{formatTime(conv.last_time)}</span>
							</div>
							<p class="text-xs text-gray-400 truncate">{conv.last_message ?? 'Conversation preview...'}</p>
						</div>
					</button>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Rechte Spalte: Chat-Bereich (wie Mockup) -->
	<div class="flex-1 bg-white border border-gray-200 rounded-xl m-4 ml-2 flex flex-col overflow-hidden">

		{#if !activeConversation}
			<div class="flex-1 flex items-center justify-center text-gray-400 text-sm">
				Wähle einen Chat aus
			</div>
		{:else}
			<!-- Nachrichten -->
			<div class="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
				{#each messages as msg}
					{#if msg.sender_id === user.id} <!-- Allways false -->
						<!-- Eigene Nachricht (rechts, blau wie Mockup) -->
						<div class="flex justify-end">
							<div class="max-w-xs">
								<div class="bg-[#2d3a9e] text-white text-sm px-4 py-2 rounded-2xl rounded-br-sm">
									{msg.content}
								</div>
								<div class="flex items-center justify-end gap-1 mt-1">
									<span class="text-xs text-gray-400">{formatTime(msg.created_at)}</span>
								</div>
							</div>
						</div>
					{:else}
						<!-- Fremde Nachricht (links, grau wie Mockup) -->
						<div class="flex justify-start">
							<div class="max-w-xs">
								<div class="bg-gray-100 text-gray-800 text-sm px-4 py-2 rounded-2xl rounded-bl-sm">
									{msg.content}
								</div>
								<div class="flex items-center gap-1 mt-1">
									<span class="text-xs text-gray-400">{formatTime(msg.created_at)}</span>
									<button class="text-gray-300 hover:text-red-400 text-xs">♡</button>
								</div>
							</div>
						</div>
					{/if}
				{/each}
			</div>

			<!-- Eingabe-Zeile (wie Mockup) -->
			<div class="border-t border-gray-200 px-4 py-3 flex items-center gap-3">
				<span class="text-gray-400 text-lg">···</span>
				<input
					type="text"
					placeholder="Type here..."
					bind:value={messageText}
					onkeydown={handleKeydown}
					class="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
				/>
				<button
					onclick={sendMessage}
					class="text-[#2d3a9e] font-bold text-lg hover:opacity-70"
				>
					▶
				</button>
			</div>
		{/if}
	</div>
</div>
