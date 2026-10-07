/* Aplica o tema salvo (claro/escuro) antes da primeira pintura.
   Sem escolha salva, segue o tema do sistema. */
(function () {
  var tema = null;
  try { tema = localStorage.getItem("np3d_theme"); } catch (e) { /* sem armazenamento */ }
  if (tema !== "light" && tema !== "dark") {
    tema = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  document.documentElement.setAttribute("data-theme", tema);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", tema === "light" ? "#F3F4F6" : "#0C0E11");
})();
