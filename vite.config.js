// A Vercel já espera um projeto Vite (é o preset configurado no
// painel). Em vez de brigar com isso, apontamos o Vite para a pasta
// design/ como raiz — sem código de jogo nenhum, só serve o que já
// existe como estático, e o mesmo projeto passa a estar pronto para o
// motor de verdade quando ele nascer.
export default {
  root: 'design',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
};
