<script>
	import '../lib/i18n/index.js'; // help with ai – svelte-i18n initialisieren
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/navbar.svelte';
	import { page } from '$app/stores';
	import { isLoading } from 'svelte-i18n';

	let { children } = $props();

	let hideNavbar = $derived(
		$page.url.pathname === '/login' || $page.url.pathname === '/register'
	);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if $isLoading}
	<!-- Kurz warten bis Übersetzungen geladen sind -->
	<div class="min-h-screen bg-gray-50"></div>
{:else}
	{#if !hideNavbar}
		<Navbar />
	{/if}
	{@render children()}
{/if}
