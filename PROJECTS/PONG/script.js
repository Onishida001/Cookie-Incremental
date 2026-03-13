// Acessando a tela do HTML
const canvas = document.getElementById("telaJogo");
const ctx = canvas.getContext("2d");

// Criando a Bola (com a sua cor personalizada!)
let bola = {
  x: 400,
  y: 200,
  raio: 10,
  velocidadeX: 5,
  velocidadeY: 5,
  cor: "blue",
};

// Criando as Raquetes
let jogador1 = { x: 10, y: 150, largura: 10, altura: 100, velocidade: 0 };
let jogador2 = { x: 780, y: 150, largura: 10, altura: 100, velocidade: 0 };

// Variáveis de Pontuação e Controle
let pontosJogador1 = 0;
let pontosJogador2 = 0;
let jogoRodando = false; // O jogo começa pausado esperando o clique no menu

// Escutando o teclado (Quando APERTA a tecla)
document.addEventListener("keydown", function (evento) {
  if (evento.key === "w" || evento.key === "W") jogador1.velocidade = -8;
  if (evento.key === "s" || evento.key === "S") jogador1.velocidade = 8;
  if (evento.key === "ArrowUp") jogador2.velocidade = -8;
  if (evento.key === "ArrowDown") jogador2.velocidade = 8;
});

// Escutando o teclado (Quando SOLTA a tecla)
document.addEventListener("keyup", function (evento) {
  if (
    evento.key === "w" ||
    evento.key === "W" ||
    evento.key === "s" ||
    evento.key === "S"
  ) {
    jogador1.velocidade = 0;
  }
  if (evento.key === "ArrowUp" || evento.key === "ArrowDown") {
    jogador2.velocidade = 0;
  }
});

// A ÚNICA Função Atualizar (agora unida corretamente)
function atualizar() {
  // A trava de segurança do menu: se for falso, o código para aqui e não move nada!
  if (!jogoRodando) return;

  jogador1.y += jogador1.velocidade;
  jogador2.y += jogador2.velocidade;

  // Impedir que as raquetes saiam da tela
  if (jogador1.y < 0) jogador1.y = 0;
  if (jogador1.y + jogador1.altura > canvas.height)
    jogador1.y = canvas.height - jogador1.altura;
  if (jogador2.y < 0) jogador2.y = 0;
  if (jogador2.y + jogador2.altura > canvas.height)
    jogador2.y = canvas.height - jogador2.altura;

  bola.x += bola.velocidadeX;
  bola.y += bola.velocidadeY;

  // Colisão em cima e embaixo
  if (bola.y - bola.raio < 0 || bola.y + bola.raio > canvas.height) {
    bola.velocidadeY *= -1;
  }

  // Colisão na raquete 1
  if (
    bola.x - bola.raio < jogador1.x + jogador1.largura &&
    bola.y > jogador1.y &&
    bola.y < jogador1.y + jogador1.altura
  ) {
    bola.velocidadeX *= -1;
  }

  // Colisão na raquete 2
  if (
    bola.x + bola.raio > jogador2.x &&
    bola.y > jogador2.y &&
    bola.y < jogador2.y + jogador2.altura
  ) {
    bola.velocidadeX *= -1;
  }

  // Marcar Ponto e Repor a Bola
  if (bola.x < 0) {
    pontosJogador2++;
    reporBola();
  } else if (bola.x > canvas.width) {
    pontosJogador1++;
    reporBola();
  }
}

// Função para repor a bola no centro após um ponto
function reporBola() {
  bola.x = canvas.width / 2;
  bola.y = canvas.height / 2;
  bola.velocidadeX *= -1;
}

// Função para desenhar tudo na tela
function desenhar() {
  // Fundo
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Pontuação
  ctx.fillStyle = "white";
  ctx.font = "50px 'Monocraft', Arial";
  ctx.fillText(pontosJogador1, 200, 60);
  ctx.fillText(pontosJogador2, 560, 60);

  // Linha tracejada no meio
  for (let i = 0; i < canvas.height; i += 40) {
    ctx.fillRect(canvas.width / 2 - 2, i, 4, 20);
  }

  // Desenhar Bola usando a sua cor personalizada!
  ctx.fillStyle = bola.cor;
  ctx.beginPath();
  ctx.arc(bola.x, bola.y, bola.raio, 0, Math.PI * 2);
  ctx.fill();

  // Desenhar Raquetes (volta para branco)
  ctx.fillStyle = "white";
  ctx.fillRect(jogador1.x, jogador1.y, jogador1.largura, jogador1.altura);
  ctx.fillRect(jogador2.x, jogador2.y, jogador2.largura, jogador2.altura);
}

// O Loop principal do jogo
function loop() {
  atualizar();
  desenhar();
  requestAnimationFrame(loop);
}

// Lógica do botão Start
const menuInicial = document.getElementById("menuInicial");
const botaoStart = document.getElementById("botaoStart");

// Verifica se os elementos do menu existem no HTML antes de adicionar o evento
if (botaoStart && menuInicial) {
  botaoStart.addEventListener("click", function () {
    menuInicial.style.display = "none";
    jogoRodando = true;
  });
}

// Inicia o jogo
loop();
