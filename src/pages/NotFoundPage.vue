<template>
  <div class="text-center space-y-4">
    <div>
      <p class="text-4xl font-bold text-slate-200">404</p>
      <h1 class="text-base font-semibold text-slate-800 mt-2">Halaman Tidak Ditemukan</h1>
      <p class="text-xs text-slate-400 mt-1">Halaman yang Anda cari tidak tersedia</p>
    </div>
    <RouterLink
      to="/dashboard"
      class="inline-flex items-center px-4 py-2 text-xs bg-navy-900 text-white rounded hover:bg-navy-950 transition-colors"
    >
      Kembali ke Dashboard
    </RouterLink>
  </div>
</template>
