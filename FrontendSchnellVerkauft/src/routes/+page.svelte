<script>
    import ListingCard from '$lib/components/ListingCard.svelte';

    
</script>

<div class="min-h-screen bg-gray-50">

    <div class="bg-white border-b border-gray-200 px-6 py-4">
        <form class="flex gap-2 max-w-2xl mx-auto">
            <input
                type="text"
                placeholder="Search for products"
                class="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#2d3a9e]"
            />
            <button
                type="submit"
                class="bg-[#2d3a9e] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#1e2b80] transition"
            >
                Suchen
            </button>
        </form>
    </div>

    <div class="max-w-6xl mx-auto px-6 py-6">

        <div class="mb-6">
            <p class="text-sm text-gray-500 mb-2 font-medium">Kategorien</p>
            <div class="flex gap-2 flex-wrap">
                {#each CATEGORIES as cat}
                    <button
                        class="px-4 py-1.5 rounded-full border text-sm transition
                            {selectedCategory === cat
                                ? 'bg-[#2d3a9e] text-white border-[#2d3a9e]'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-[#2d3a9e]'}"
                    >
                        {cat}
                    </button>
                {/each}
            </div>
        </div>

        {#if errorMsg}
            <p class="text-red-500 text-sm mb-4">{errorMsg}</p>
        {/if}

        {#if loading} //idea from chat gpt for smother loading
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
                <p class="text-lg">Keine Anzeigen gefunden.</p>
                <a href="/listings/new" class="text-[#2d3a9e] text-sm mt-2 inline-block hover:underline">
                    Erste Anzeige erstellen →
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