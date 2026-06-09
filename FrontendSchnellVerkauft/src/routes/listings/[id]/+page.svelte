<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getUser } from '$lib/assets/user.svelte.js';

	let listing = $state(null);
	let loading = $state(true);
	let errorMsg = $state('');
	let selectedImage = $state(0); // help with ai – aktives Bild im Slider
	let isFavorite = $state(false);

	let user = $derived(getUser());
	let listingId = $derived($page.params.id);

	async function fetchListing() {
		loading = true;
		try {
			const res = await fetch(`http://localhost:3000/api/listings/${listingId}`);
			if (!res.ok) { errorMsg = 'Anzeige nicht gefunden.'; return; }
			listing = await res.json();
		} catch {
			errorMsg = 'Server nicht erreichbar.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		fetchListing();
	});

	async function handleDelete() {
		const token = localStorage.getItem('token');
		await fetch(`http://localhost:3000/api/listings/${listingId}`, {
			method: 'DELETE',
			headers: { 'Authorization': `Bearer ${token}` }
		});
		goto('/');
	}

	async function startChat() {
		const token = localStorage.getItem('token');
		if (!token) { goto('/login'); return; }

		const res = await fetch('http://localhost:3000/api/conversations', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify({ listing_id: listingId, seller_id: listing.user_id })
		});
		const data = await res.json();
		goto(`/chat?conversation=${data.conversationId}`);
	}
</script>


<div class="bg-[#2d3a9e] px-6 py-3">
	<span class="text-white font-semibold text-base">Detail</span>
</div>

<div class="min-h-screen bg-white px-6 py-8">
	{#if loading}
		<div class="max-w-4xl mx-auto animate-pulse">
			<div class="flex gap-6">
				<div class="flex gap-3">
					<div class="flex flex-col gap-2">
						{#each Array(3) as _}
							<div class="w-24 h-24 bg-gray-200 rounded-lg"></div>
						{/each}
					</div>
					<div class="w-96 h-72 bg-gray-200 rounded-xl"></div>
				</div>
				<div class="flex-1 space-y-3 pt-4">
					<div class="h-5 bg-gray-200 rounded w-1/3"></div>
					<div class="h-8 bg-gray-200 rounded w-1/4"></div>
					<div class="h-4 bg-gray-200 rounded w-full"></div>
				</div>
			</div>
		</div>

	{:else if errorMsg}
		<p class="text-red-500 text-center mt-20">{errorMsg}</p>

	{:else if listing}
		<div class="max-w-4xl mx-auto">
			<div class="bg-gray-50 rounded-xl p-6 flex gap-6 flex-wrap">

				<div class="flex gap-3 shrink-0">
					<!-- Thumbnail-Spalte -->
					<div class="flex flex-col gap-2">
						{#each listing.images as img, i}
							<button
								onclick={() => selectedImage = i}
								class="w-24 h-24 rounded-lg overflow-hidden border-2 transition
									{selectedImage === i ? 'border-[#2d3a9e]' : 'border-transparent'}"
							>
								<img
									src="http://localhost:3000{img}"
									alt="Bild {i + 1}"
									class="w-full h-full object-cover"
								/>
							</button>
						{:else}
							<div class="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
								Kein Bild
							</div>
						{/each}
					</div>

					<div class="relative w-80 h-72 rounded-xl overflow-hidden bg-gray-200">
						{#if listing.images?.length > 0}
							<img
								src="http://localhost:3000{listing.images[selectedImage]}"
								alt={listing.title}
								class="w-full h-full object-cover"
							/>
						{:else}
							<div class="w-full h-full flex items-center justify-center text-gray-400">Kein Bild</div>
						{/if}
						<button class="absolute top-2 right-2 bg-white/80 rounded-md p-1 text-gray-600 hover:bg-white">
							⛶
						</button>
					</div>
				</div>

				<div class="flex-1 flex flex-col min-w-48">
					<h1 class="text-[#2d3a9e] font-bold text-lg mb-1">{listing.title}</h1>
					<p class="text-gray-800 text-2xl font-semibold mb-3">{listing.price} €</p>
					<p class="text-gray-400 text-sm mb-1">{listing.category} · {listing.location}</p>
					<p class="text-gray-600 text-sm leading-relaxed mb-4">{listing.description}</p>

					<div class="mt-auto space-y-3">

						<div class="flex justify-end">
							<button
								onclick={() => isFavorite = !isFavorite}
								class="text-2xl transition {isFavorite ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}"
							>
								♥
							</button>
						</div>

						{#if user && user.id === listing.user_id}
							<button
								onclick={handleDelete}
								class="w-full border border-red-300 text-red-500 py-2 rounded-lg text-sm hover:bg-red-50 transition"
							>
								Anzeige löschen
							</button>
						{:else}
							<button
								onclick={startChat}
								class="w-full border border-[#2d3a9e] text-[#2d3a9e] py-2 rounded-lg text-sm hover:bg-blue-50 transition"
							>
								Message {listing.username}
							</button>
						{/if}
					</div>
				</div>

			</div>
		</div>
	{/if}
</div>
