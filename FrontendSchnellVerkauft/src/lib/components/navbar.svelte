<script>
    import { goto } from '$app/navigation';
    import { getUser, clearUser, getUnreadCount, setUnreadCount, incrementUnread } from '$lib/assets/user.svelte.js';
    import { io } from 'socket.io-client';
    import { onDestroy } from 'svelte';
    import { page } from '$app/stores';
    
    // 1. i18n importieren
    import { locale, _ } from 'svelte-i18n'; 

    function handleLogout() {
        localStorage.removeItem('token');
        clearUser();
        goto('/login');
    }

    let user = $derived(getUser());
    let unread = $derived(getUnreadCount());

    // Socket nur verbinden wenn eingeloggt, um unread-Badge live zu aktualisieren
    let socket = null;

    $effect(() => {
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

    // 2. Funktion zum Wechseln und Speichern der Sprache
    function switchLanguage(lang) {
        locale.set(lang);
        localStorage.setItem('lang', lang);
    }
</script>

<nav class="bg-[#2d3a9e] text-white px-6 py-3 flex items-center justify-between shadow-md">
    <a href="/" class="text-xl font-bold tracking-tight hover:opacity-90">
        SchnellVerkauft
    </a>

    <div class="flex items-center gap-4">
        
        <div class="flex items-center bg-[#1e2b80] rounded-lg p-0.5 mr-2">
            <button
                onclick={() => switchLanguage('de')}
                class="px-2 py-1 text-xs font-bold rounded transition-colors {$locale === 'de' ? 'bg-[#2d3a9e] text-white shadow-sm' : 'text-white/60 hover:text-white'}"
            >
                DE
            </button>
            <button
                onclick={() => switchLanguage('en')}
                class="px-2 py-1 text-xs font-bold rounded transition-colors {$locale === 'en' ? 'bg-[#2d3a9e] text-white shadow-sm' : 'text-white/60 hover:text-white'}"
            >
                EN
            </button>
        </div>

        {#if user}
            <a
                href="/listings/new"
                class="bg-white text-[#2d3a9e] font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-gray-100 transition"
            >
                {$_('nav.create_ad', { default: '+ Anzeige erstellen' })}
            </a>

            <a
                href="/chat"
                onclick={() => setUnreadCount(0)}
                class="text-sm hover:opacity-80 relative"
            >
                {$_('nav.chats', { default: 'Chats' })}
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
                {$_('nav.logout', { default: 'Logout' })}
            </button>
        {:else}
            <a href="/login" class="text-sm hover:opacity-80">
                {$_('nav.login', { default: 'Anmelden' })}
            </a>
            <a
                href="/register"
                class="bg-white text-[#2d3a9e] font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-gray-100 transition"
            >
                {$_('nav.register', { default: 'Registrieren' })}
            </a>
        {/if}
    </div>
</nav>