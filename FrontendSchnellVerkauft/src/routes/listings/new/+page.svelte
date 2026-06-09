<script>
	import { goto } from '$app/navigation';

	const CATEGORIES = ['Kleidung', 'Elektronik', 'Sport', 'Auto', 'Wohnen', 'Sonstiges'];

	let title = $state('');
	let description = $state('');
	let price = $state('');
	let category = $state('');
	let location = $state('');
	let imageFiles = $state([]); // help with ai
	let errorMsg = $state('');
	let loading = $state(false);

	function handleFileChange(e) { // help with ai
		imageFiles = Array.from(e.target.files).slice(0, 5);
	}

	async function handleSubmit() {
		errorMsg = '';

		if (!title || !description || !price || !category || !location) {
			errorMsg = 'Bitte alle Felder ausfüllen.';
			return;
		}
		if (isNaN(price) || Number(price) <= 0) {
			errorMsg = 'Bitte einen gültigen Preis eingeben.';
			return;
		}

		const token = localStorage.getItem('token');
		if (!token) {
			goto('/login');
			return;
		}

		loading = true;
		try {
			const res = await fetch('http://localhost:3000/api/listings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ title, description, price: Number(price), category, location })
			});

			const data = await res.json();
			if (!res.ok) {
				errorMsg = data.error || 'Anzeige konnte nicht erstellt werden.';
				return;
			}

			
			if (imageFiles.length > 0) {
				const formData = new FormData(); // help with ai
				for (const file of imageFiles) {
					formData.append('images', file);
				}
				await fetch(`http://localhost:3000/api/listings/${data.listingId}/images`, {
					method: 'POST',
					headers: { 'Authorization': `Bearer ${token}` },
					body: formData
				});
			}

			goto(`/listings/${data.listingId}`);
		} catch {
			errorMsg = 'Server nicht erreichbar.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50 py-10 px-4">
	<div class="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">

		<h1 class="text-2xl font-bold text-gray-800 mb-6">Anzeige erstellen</h1>

		{#if errorMsg}
			<div class="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
				{errorMsg}
			</div>
		{/if}

		<div class="space-y-4">

			<div>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="block text-sm font-medium text-gray-700 mb-1">Titel</label>
				<input
					type="text"
					placeholder="z.B. MacBook Pro 2019"
					bind:value={title}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a9e]"
				/>
			</div>

			<div>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
				<textarea
					placeholder="Beschreibung der Anzeige..."
					bind:value={description}
					rows="4"
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a9e] resize-none"
				></textarea>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-sm font-medium text-gray-700 mb-1">Preis (€)</label>
					<input
						type="number"
						placeholder="0.00"
						bind:value={price}
						min="0"
						step="0.01"
						class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a9e]"
					/>
				</div>
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-sm font-medium text-gray-700 mb-1">Standort</label>
					<input
						type="text"
						placeholder="z.B. Wien"
						bind:value={location}
						class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a9e]"
					/>
				</div>
			</div>

			<div>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
				<select
					bind:value={category}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d3a9e] bg-white"
				>
					<option value="">Kategorie wählen...</option>
					{#each CATEGORIES as cat}
						<option value={cat}>{cat}</option>
					{/each}
				</select>
			</div>

			<!-- Bild-Upload -->
			<div>
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="block text-sm font-medium text-gray-700 mb-1">
					Fotos (max. 5)
				</label>
				<label
					class="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg py-6 cursor-pointer hover:border-[#2d3a9e] transition"
				>
					<span class="text-gray-400 text-sm">Klicken zum Hochladen</span>
					<span class="text-gray-400 text-xs mt-1">JPG, PNG, WEBP – max. 10 MB pro Bild</span>
					<input
						type="file"
						accept="image/*"
						multiple
						class="hidden"
						onchange={handleFileChange}
					/>
				</label>

				{#if imageFiles.length > 0}
					<div class="flex gap-2 mt-3 flex-wrap">
						{#each imageFiles as file}
							<div class="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
								<img
									src={URL.createObjectURL(file)}
									alt={file.name}
									class="w-full h-full object-cover"
								/>
							</div>
						{/each}
					</div>
				{/if}
			</div>

		</div>

		<button
			onclick={handleSubmit}
			disabled={loading}
			class="mt-6 w-full bg-[#2d3a9e] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#1e2b80] transition disabled:opacity-60 disabled:cursor-not-allowed"
		>
			{loading ? 'Wird veröffentlicht...' : 'Anzeige veröffentlichen'}
		</button>

	</div>
</div>
