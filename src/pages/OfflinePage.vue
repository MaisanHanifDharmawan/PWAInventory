<template>
  <div class="text-center space-y-4">
    <div class="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto">
      <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </div>
    <div>
      <h1 class="text-base font-semibold text-slate-800">Tidak Ada Koneksi</h1>
      <p class="text-xs text-slate-400 mt-1">Periksa koneksi internet Anda dan coba lagi</p>
    </div>
    <button
      class="px-4 py-2 text-xs bg-navy-900 text-white rounded hover:bg-navy-950 transition-colors"
      @click="window.location.reload()"
    >
      Coba Lagi
    </button>
  </div>
</template>
