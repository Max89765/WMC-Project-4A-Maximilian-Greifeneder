<script>
    let { listing } = $props();
</script>

<a
    href="/listings/{listing.id}"
    class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition block"
>
    <div class="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
        {#if listing.image}
            <img
                src="http://localhost:3000{listing.image}"
                alt={listing.title}
                class="w-full h-full object-cover"
            />
        {:else}
            <span class="text-gray-400 text-sm">Kein Bild</span>
        {/if}
    </div>
    <div class="p-3">
        <p class="text-[#2d3a9e] font-bold text-base">{listing.price} €</p>
        <p class="text-gray-800 text-sm font-medium truncate">{listing.title}</p>
        <p class="text-gray-400 text-xs mt-0.5">{listing.username}</p>
        <p class="text-gray-400 text-xs">{listing.location}</p>
    </div>
</a>