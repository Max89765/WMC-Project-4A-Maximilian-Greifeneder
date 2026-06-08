<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/Navbar.svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	let hideNavbar = $derived(
		$page.url.pathname === '/login' || $page.url.pathname === '/register'
	);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if !hideNavbar}
	<Navbar />
{/if}

{@render children()}
