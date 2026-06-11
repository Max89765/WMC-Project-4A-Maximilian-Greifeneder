<script>
	import ListingCard from '$lib/components/ListingCard.svelte';
	import { _ } from 'svelte-i18n';

	const CATEGORIES = [
		{ key: 'cat.clothing',    value: 'Kleidung'    },
		{ key: 'cat.electronics', value: 'Elektronik'  },
		{ key: 'cat.sports',      value: 'Sport'       },
		{ key: 'cat.cars',        value: 'Auto'        },
		{ key: 'cat.furniture',   value: 'Möbel'       },
		{ key: 'cat.other',       value: 'Sonstiges'   },
	];

	let listings = $state([]);
	let loading = $state(true);
	let searchQuery = $state('');
	let selectedCategory = $state('');
	let errorMsg = $state('');

	async function fetchListings() {
		loading = true;
		errorMsg = '';
		try {
			const params = new URLSearchParams(); //help with ai
			if (searchQuery) params.set('q', searchQuery);
			if (selectedCategory) params.set('category', selectedCategory);
			const res = await fetch(`http://localhost:3000/api/listings?${params}`);
			listings = await res.json();
		} catch {
			errorMsg = $_('home.load_error');
		} finally {
			loading = false;
		}
	}

	$effect(() => { fetchListings(); });

	function handleSearch(e) { e.preventDefault(); fetchListings(); }

	function selectCategory(value) {
		selectedCategory = selectedCategory === value ? '' : value;
		fetchListings();
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="bg-white border-b border-gray-200 px-6 py-4">
		<form onsubmit={handleSearch} class="flex gap-2 max-w-2xl mx-auto">
			<input type="text" placeholder={$_('home.search_placeholder')} bind:value={searchQuery}
				class="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#2d3a9e]" />
			<button type="submit" class="bg-[#2d3a9e] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#1e2b80] transition">
				{$_('home.search_btn')}
			</button>
		</form>
	</div>

	<div class="max-w-6xl mx-auto px-6 py-6">
		<div class="mb-6">
			<p class="text-sm text-gray-500 mb-2 font-medium">{$_('home.categories')}</p>
			<div class="flex gap-2 flex-wrap">
				{#each CATEGORIES as cat}
					<button onclick={() => selectCategory(cat.value)}
						class="px-4 py-1.5 rounded-full border text-sm transition
							{selectedCategory === cat.value
								? 'bg-[#2d3a9e] text-white border-[#2d3a9e]'
								: 'bg-white text-gray-600 border-gray-300 hover:border-[#2d3a9e]'}">
						{$_(cat.key)}
					</button>
				{/each}
			</div>
		</div>

		{#if errorMsg}<p class="text-red-500 text-sm mb-4">{errorMsg}</p>{/if}

		{#if loading}
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
				{#each Array(8) as _}
					<div class="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
						<div class="h-40 bg-gray-200"></div>
						<div class="p-3 space-y-2">
							<div class="h-4 bg-gray-200 rounded w-3/4"></div>
							<div class="h-3 bg-gray-200 rounded w-1/2"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if listings.length === 0}
			<div class="text-center py-20 text-gray-400">
				<p class="text-lg">{$_('home.no_listings')}</p>
				<a href="/listings/new" class="text-[#2d3a9e] text-sm mt-2 inline-block hover:underline">
					{$_('home.create_first')}
				</a>
			</div>
		{:else}
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
				{#each listings as listing}
					<ListingCard {listing} />
				{/each}
			</div>
		{/if}
	</div>
</div>
