// ─────────────────────────────────────────────────────────
// O POÇO — QUEM DESCE, SOBE OUTRO
//
// Água Preta tem um poço que não seca. Todos os outros do vale secaram
// no inverno de onze anos atrás; o de Água Preta continua dando água
// doce e fria, e ninguém no povoado fala disso — nem entre si. Todo
// inverno alguém desce a corda para "limpar o fundo". Nunca volta a
// mesma pessoa. Este ano a sorte caiu na Iara. Faz nove dias.
//
// Você desce atrás dela.
//
// A VIRADA
// O poço não leva ninguém. Ele DEVOLVE. Quem desce fica guardado lá
// embaixo, e o que sobe no lugar tem a cara, a voz e as lembranças — só
// não é. O povoado sabe: é por isso que ninguém toca no assunto, nem
// entre si. Metade de Água Preta já subiu.
//
// A Iara se vendou sozinha e amarrou as próprias mãos antes de chegar ao
// fundo, porque quem olha para o fundo para de querer subir. Para tirar
// ela de lá, você tem que guiá-la de olhos fechados. A última escolha do
// jogo é essa: olhar ou não olhar.
//
// COMO AS VIGIAS FUNCIONAM
// As três Vigias barram o caminho e fazem uma pergunta cada. Não é
// prova: é leitura de pessoa. A resposta que abre a passagem está sempre
// dita na fala DELA ou plantada no cenário logo antes — roupa de inverno
// no calor, caderno que ela não abre, uma conta que não fecha. Errar não
// mata: custa uma flecha e a pergunta volta.
//
// Cada Vigia aparece três vezes na mesma fase, sempre à sua frente,
// sempre sem lembrar da vez anterior. É de propósito.
// ─────────────────────────────────────────────────────────

export interface Fala {
  quem: string;
  texto: string;
}

export interface Escolha {
  label: string;
  /** a que faz a Vigia sair da frente; as outras rendem flecha */
  certa: boolean;
  resultado: string;
}

export interface Desafio {
  id: string;
  /** o que ela diz antes de perguntar */
  fala: Fala[];
  pergunta: string;
  escolhas: Escolha[];
  /** o que ela passa a dizer depois, com a passagem já aberta */
  depois: string;
}

// ── as nove paradas ──────────────────────────────────────

export const DESAFIOS: Record<string, Desafio> = {
  // ─── ÁGUA PRETA · Bruna ───
  //
  // A regra da primeira fase é: não acorda ela. Bruna morreu no inverno
  // de onze anos atrás e não sabe. Toda resposta que abre a passagem é a
  // que mantém a versão dela de pé.
  cerca: {
    id: 'cerca',
    fala: [
      { quem: 'BRUNA', texto: 'Você demorou, Doril.' },
      {
        quem: 'BRUNA',
        texto:
          'Deixa eu olhar você. Está mais magro. Sua mãe vive dizendo que você não come, e eu ' +
          'vivo dizendo para ela que homem feito come quando tem fome.',
      },
      {
        quem: 'BRUNA',
        texto:
          'Fecha o portão atrás de você que o gado sai. Ninguém neste povoado fecha portão.',
      },
    ],
    pergunta:
      'Ela está de casaco de lã e coturno, com um calor que racha pedra. Chamou você de Doril duas vezes.',
    escolhas: [
      {
        label: 'Deixar ela chamar você de Doril',
        certa: true,
        resultado:
          'Você fecha o portão. Ela balança a cabeça, satisfeita, e abre caminho.\n\n' +
          'Passando por ela, você repara no casaco: tem gelo derretendo na gola, escorrendo pelo ' +
          'pescoço dela e sumindo antes de chegar no ombro. Ela não sente.\n\n' +
          'Doril morreu de febre quando você era criança. Você lembra do enterro.',
      },
      {
        label: 'Dizer que você não é Doril',
        certa: false,
        resultado:
          'Ela para. O sorriso continua no rosto, mas para de mexer, como coisa desenhada.\n\n' +
          '"Como assim você não é." Ela repete isso três vezes, cada vez mais devagar, e na ' +
          'terceira já está com a corda do arco puxada até a orelha.\n\n' +
          'A flecha entra sem que ela tenha mudado de expressão.',
      },
      {
        label: 'Perguntar quem é Doril',
        certa: false,
        resultado:
          'Ela abre a boca para responder e não responde. Fica assim, de boca aberta, olhando ' +
          'para as próprias mãos como quem procura uma palavra que estava ali agora.\n\n' +
          'Você entende tarde demais que fez uma pergunta que ela não tem como responder — e ' +
          'que ela vai defender esse buraco com o que tiver na mão.',
      },
    ],
    depois: 'Fecha o portão, menino. Neste povoado ninguém fecha nada.',
  },

  feira: {
    id: 'feira',
    fala: [
      { quem: 'BRUNA', texto: 'Você demorou, Doril.' },
      {
        quem: 'BRUNA',
        texto:
          'Já vou fechar a banca. Leva uma maçã para sua mãe, que essas aí são da árvore de cima ' +
          'e ela gosta.',
      },
      {
        quem: 'BRUNA',
        texto:
          'Deixa a moeda na tigela. Eu confio, mas conta é conta.',
      },
    ],
    pergunta:
      'É a mesma Bruna, e ela não lembra do portão. Na tigela tem moeda antiga demais para circular, e as maçãs da banca estão perfeitas — nenhuma bicada, nenhuma mancha, no fim de uma tarde inteira de sol.',
    escolhas: [
      {
        label: 'Deixar uma moeda e pegar a maçã',
        certa: true,
        resultado:
          'A moeda cai na tigela com um som errado, de coisa mais leve do que devia. Bruna nem ' +
          'olha. Você pega a maçã e ela abre caminho.\n\n' +
          'A maçã é fria. Não fresca: fria, de coisa que passou a noite fora. E ela pesa como ' +
          'pedra na sua mão até você largar, três passos adiante, e não ouvir ela cair.',
      },
      {
        label: 'Dizer que você não tem dinheiro',
        certa: false,
        resultado:
          'Bruna ri. "Todo mundo tem dinheiro, Doril." E fica esperando.\n\n' +
          'A espera dura mais do que espera de gente. Ela não pisca. E quando você mexe o pé ' +
          'para trás, o arco já está armado — como se ele estivesse armado esse tempo todo e ' +
          'você é que só tivesse reparado agora.',
      },
      {
        label: 'Pegar a maçã sem pagar',
        certa: false,
        resultado:
          '"Conta é conta", ela diz, no mesmo tom simpático de antes.\n\n' +
          'A flecha atravessa a maçã na sua mão e continua. Você olha para trás e a maçã está de ' +
          'volta na banca, inteira, com as outras.',
      },
    ],
    depois: 'Leva para sua mãe enquanto está boa. Nada aqui fica bom por muito tempo.',
  },

  ano: {
    id: 'ano',
    fala: [
      { quem: 'BRUNA', texto: 'Você demorou, Do…' },
      {
        quem: 'BRUNA',
        texto:
          'Espera. Espera aí. Eu já falei isso hoje. Eu falei isso hoje e você já passou por ' +
          'aqui, e o portão continua aberto.',
      },
      {
        quem: 'BRUNA',
        texto:
          'Me responde só uma coisa, e responde direito, porque eu estou com uma dúvida na ' +
          'cabeça desde de manhã e ela não sai. Que ano é?',
      },
    ],
    pergunta:
      'Ela está olhando para as próprias mãos. O gelo da gola do casaco não derrete mais — congelou de novo. O poço secou no vale inteiro há onze invernos, e foi nesse inverno que enterraram a Bruna.',
    escolhas: [
      {
        label: 'Dizer o ano de onze invernos atrás',
        certa: true,
        resultado:
          'Você diz o ano em que ela morreu.\n\n' +
          'O corpo dela inteiro relaxa de uma vez, como quem larga um peso que estava segurando ' +
          'sem saber. "Ah." Ela ri sozinha. "Que besteira a minha." E sai da frente.\n\n' +
          'Passando, você ouve ela dizer baixinho, para ninguém: "Achei que fosse mais."\n\n' +
          'Foi. Foi muito mais.',
      },
      {
        label: 'Dizer o ano de verdade',
        certa: false,
        resultado:
          'Você diz. Ela conta nos dedos. Conta de novo. Conta uma terceira vez e para no meio, ' +
          'com os dedos abertos no ar.\n\n' +
          '"Não." A voz sai de um lugar mais fundo do que a boca dela. "Não, não, não, não."\n\n' +
          'O que ela faz com o arco depois disso não é mira. É pânico.',
      },
      {
        label: 'Dizer que não sabe',
        certa: false,
        resultado:
          '"Como assim não sabe? Todo mundo sabe que ano é."\n\n' +
          'Ela dá um passo na sua direção e você vê, pela primeira vez de perto, que as botas ' +
          'dela não afundam na terra fofa. Ficam por cima.\n\n' +
          'Ela pergunta de novo. E de novo. E na quarta vez não é mais pergunta.',
      },
    ],
    depois: 'Achei que fosse mais. Vai, menino. O portão do fundo é aquele.',
  },

  // ─── A BOCA · Nita ───
  //
  // A segunda fase é sobre a CONTA. Nita anota quem desce e quem sobe, e
  // a conta fecha todo ano. É esse fechamento que devia assustar.
  conta: {
    id: 'conta',
    fala: [
      { quem: 'NITA', texto: 'Alto lá. Quem desce, eu anoto. É o combinado.' },
      {
        quem: 'NITA',
        texto:
          'Onze invernos, onze descidas, onze subidas. Confere no caderno se quiser. Nunca ' +
          'faltou ninguém neste poço, ao contrário do que o povo gosta de dizer lá em cima.',
      },
      {
        quem: 'NITA',
        texto:
          'Este ano desceu uma. Faz nove dias. Então me fala: quantos vão subir?',
      },
    ],
    pergunta:
      'O caderno está aberto no colo dela. Onze linhas, e em todas o número da direita é igual ao da esquerda. A linha deste ano tem uma descida anotada, e o espaço da subida já está preenchido — com tinta seca.',
    escolhas: [
      {
        label: 'Dois: você e ela',
        certa: false,
        resultado:
          'Nita franze a testa e passa o dedo pela linha do ano.\n\n' +
          '"Dois não pode. Nunca subiu dois." Ela diz isso como quem corrige uma criança na ' +
          'tabuada, e continua repetindo enquanto arma o arco, sem raiva nenhuma. ' +
          '"Nunca subiu dois. Nunca subiu dois. Nunca subiu dois."',
      },
      {
        label: 'Um',
        certa: true,
        resultado:
          'Nita confere no caderno e assente. "Um. Está certo."\n\n' +
          'Ela sai da frente e você segue. Só depois de uns passos é que a conta bate na sua ' +
          'cabeça pelo lado errado: a Iara desceu e não subiu. Se um vai subir, e a conta dela ' +
          'nunca falha, então quem vai subir não é a Iara.\n\n' +
          'A tinta da subida deste ano já estava seca antes de você chegar.',
      },
      {
        label: 'Nenhum',
        certa: false,
        resultado:
          '"Nenhum?" Ela ri, e é a primeira coisa nela que soa viva. "Menino, deste poço sempre ' +
          'sobe alguém. Sempre. É essa a graça dele."\n\n' +
          'A flecha vem no meio da risada, e a risada não para quando a flecha sai.',
      },
    ],
    depois: 'Um desce, um sobe. Nunca falhou. É o que me deixa dormir.',
  },

  nome: {
    id: 'nome',
    fala: [
      { quem: 'NITA', texto: 'Alto lá. Quem desce, eu anoto.' },
      {
        quem: 'NITA',
        texto:
          'Falta o nome. Não posso anotar descida sem nome, senão na hora de fechar a conta eu ' +
          'não sei quem é que voltou.',
      },
      {
        quem: 'NITA',
        texto:
          'Fala aí. Eu escrevo na coluna da esquerda e a gente resolve a da direita depois.',
      },
    ],
    pergunta:
      'É a mesma Nita e ela não lembra da conta de agora há pouco. Nas onze linhas antigas, os nomes da esquerda e os da direita são os mesmos — a mesma letra, a mesma tinta, escritos na mesma hora.',
    escolhas: [
      {
        label: 'Dar o seu nome',
        certa: false,
        resultado:
          'Você fala. Ela escreve na esquerda. E escreve de novo na direita, no mesmo movimento, ' +
          'sem levantar a pena.\n\n' +
          '"Pronto. Fechado." Você olha o caderno e o seu nome está lá duas vezes, e a segunda ' +
          'vez foi escrita antes de você subir.\n\n' +
          'Quando você recua, ela levanta a cabeça devagar. "Já anotei. Agora não dá para desistir."',
      },
      {
        label: 'Dar o nome da Iara',
        certa: false,
        resultado:
          '"Iara já está anotada. Nove dias." Ela vira a página e mostra. E mostra a coluna da ' +
          'direita, onde o nome da Iara também já está.\n\n' +
          '"Dois iguais na mesma linha não pode." A pena dela para no ar. "Então um dos dois ' +
          'está sobrando."\n\n' +
          'Ela decide qual sem consultar você.',
      },
      {
        label: 'Não dar nome nenhum',
        certa: true,
        resultado:
          'Ela espera. Você não fala.\n\n' +
          'Ela dá de ombros e escreve alguma coisa curta na coluna da esquerda. Você estica o ' +
          'pescoço e é um risco. Um traço só, como quem marca gado.\n\n' +
          '"Sem nome eu não fecho a linha", ela resmunga, e sai da frente contrariada.\n\n' +
          'Sem nome ela não fecha a linha. É a primeira coisa boa que acontece hoje.',
      },
    ],
    depois: 'Linha aberta me incomoda. Mas cara sem nome eu já vi subir, e não quero ver de novo.',
  },

  corda: {
    id: 'corda',
    fala: [
      { quem: 'NITA', texto: 'Alto lá. Quem desce, eu…' },
      {
        quem: 'NITA',
        texto:
          'Você de novo. Você passou por aqui e eu anotei um risco, e agora tem um risco na ' +
          'coluna da esquerda me olhando desde de manhã.',
      },
      {
        quem: 'NITA',
        texto:
          'A corda é minha. Eu solto e eu recolho. Se eu recolher com você lá embaixo, você fica. ' +
          'Então diz: eu recolho quando?',
      },
    ],
    pergunta:
      'A corda ao lado dela está enrolada e seca. Nas onze descidas do caderno, nenhuma linha tem hora anotada — só um mesmo rabisco repetido, que de perto é uma palavra: "sozinha".',
    escolhas: [
      {
        label: 'Quando eu puxar a corda de baixo',
        certa: false,
        resultado:
          '"De baixo ninguém puxa." Ela diz isso sem nenhuma dureza, do jeito de quem já ' +
          'explicou muitas vezes. "Lá embaixo você esquece que tem corda."\n\n' +
          'Ela põe a mão no arco. "Quem promete puxar de baixo é porque nunca desceu, e quem ' +
          'nunca desceu não desce."',
      },
      {
        label: 'Quando a corda subir sozinha',
        certa: true,
        resultado:
          'Nita para. Olha para você com atenção de verdade pela primeira vez.\n\n' +
          '"Você leu meu caderno." Ela fecha o caderno com força e sai da frente sem falar mais nada.\n\n' +
          'Você desce olhando a corda. Ela vai ficando bamba, depois frouxa, depois começa a ' +
          'subir, um palmo por vez, sem ninguém puxando.\n\n' +
          'Ela sobe sozinha porque lá embaixo alguém solta. Todo ano.',
      },
      {
        label: 'Nunca. Deixa a corda',
        certa: false,
        resultado:
          '"Corda largada apodrece", ela diz. "E corda podre no poço é gente presa lá embaixo."\n\n' +
          'Ela olha para o poço com uma cara que você não sabe ler e depois olha para você com ' +
          'uma cara que você sabe.\n\n' +
          '"Não vou deixar mais um preso lá."',
      },
    ],
    depois: 'A corda sobe sozinha. Sempre subiu. Nunca quis saber por quê.',
  },

  // ─── O FUNDO · Vilma ───
  //
  // A terceira Vigia não está dormindo. Ela lembra de tudo, e por isso
  // guarda a saída em vez da entrada.
  saida: {
    id: 'saida',
    fala: [
      { quem: 'VILMA', texto: 'Você está de costas para o lado errado.' },
      {
        quem: 'VILMA',
        texto:
          'As outras duas guardam a descida. Eu guardo a subida. É trabalho diferente e ninguém ' +
          'quer, porque para guardar a subida você precisa estar acordada.',
      },
      {
        quem: 'VILMA',
        texto:
          'Estou acordada há onze anos. Sei meu nome, sei o dia em que desci, sei quem me mandou ' +
          'e sei que ela está viva lá em cima com a minha cara. Pergunta o que você veio ' +
          'perguntar e não me faz perder tempo.',
      },
    ],
    pergunta:
      'É uma serra nevada, e vocês estão a cinquenta braças abaixo de uma horta. A neve encosta na sua bota e não derrete.',
    escolhas: [
      {
        label: 'Perguntar onde está a Iara',
        certa: true,
        resultado:
          'Vilma aponta com o queixo, sem tirar a mão do arco.\n\n' +
          '"Sentada, no fim da trilha. Amarrada e vendada, e amarrou sozinha — o que já diz o ' +
          'quanto de miolo ainda sobrou nela, que é mais do que sobra na maioria."\n\n' +
          'Ela sai da frente meio passo, o suficiente para caber uma pessoa.\n\n' +
          '"Vai. E te adianto uma coisa de graça: o que você achar que é ela mexendo a cabeça, ' +
          'não é ela mexendo a cabeça."',
      },
      {
        label: 'Perguntar como sair daqui',
        certa: false,
        resultado:
          '"Errou a pergunta." Ela nem levanta a voz.\n\n' +
          '"Quem chega aqui perguntando a saída antes de perguntar pela pessoa, já veio sem a ' +
          'pessoa. E quem vem sem a pessoa vem buscar outra coisa."\n\n' +
          'O arco sobe. "E eu conheço muito bem o que vem buscar outra coisa."',
      },
      {
        label: 'Perguntar o que ela é',
        certa: false,
        resultado:
          '"O que eu SOU." Ela repete a palavra com nojo. "Eu sou a Vilma. Filha do Doril, ' +
          'irmã da Nita, desci em janeiro com uma corda na cintura."\n\n' +
          'Ela chega mais perto do que devia. "O que subiu com a minha cara é que é um o quê. ' +
          'Você acabou de me chamar do que eu passei onze anos não sendo."',
      },
    ],
    depois: 'Sentada, no fim da trilha. E não olha para o fundo, menino. Olhar é o que prende.',
  },

  olhar: {
    id: 'olhar',
    fala: [
      { quem: 'VILMA', texto: 'Você está de costas para o lado errado. Outra vez.' },
      {
        quem: 'VILMA',
        texto:
          'Não estou repetindo por doença. Estou repetindo porque você repetiu. Você já passou ' +
          'por mim e voltou, e não lembra de ter voltado.',
      },
      {
        quem: 'VILMA',
        texto:
          'Isso começa assim. Primeiro você anda um trecho duas vezes. Depois você acha bonito ' +
          'aqui embaixo. Depois você senta. Me diz: você olhou para o fundo?',
      },
    ],
    pergunta:
      'Você não lembra de ter voltado. Mas as suas pegadas na neve vão e vêm, e as de vinda são mais fundas — feitas por alguém sem pressa.',
    escolhas: [
      {
        label: 'Admitir: você olhou',
        certa: true,
        resultado:
          'Vilma solta o ar pelo nariz. Não é alívio; é o contrário.\n\n' +
          '"Todo mundo olha. Quem diz que não olhou já está longe demais para saber que olhou." ' +
          'Ela puxa você pelo braço e a mão dela é fria de um jeito que atravessa a manga.\n\n' +
          '"Enquanto você conseguir contar que olhou, ainda dá. Anda logo, e da trilha para a ' +
          'frente você fecha os olhos e vai pelo som da corda."',
      },
      {
        label: 'Negar: você não olhou',
        certa: false,
        resultado:
          'Ela solta o arco, e é pior do que se tivesse armado.\n\n' +
          '"Então não tem mais o que eu faça." Ela vira as costas e senta na neve, de frente ' +
          'para o escuro, como quem já cumpriu a parte dela.\n\n' +
          'A flecha que te acerta não é dela. Vem do escuro, e vem de baixo.',
      },
      {
        label: 'Dizer que não lembra',
        certa: false,
        resultado:
          '"Não lembra." Ela repete devagar. "Não lembra de olhar, não lembra de voltar."\n\n' +
          'Ela conta nos dedos, e você reconhece o gesto: é o mesmo da Bruna, no portão.\n\n' +
          '"Eu já vi essa conta terminar." O arco sobe, e ela pede desculpa antes de soltar.',
      },
    ],
    depois: 'Enquanto você conseguir contar que olhou, ainda dá. Anda.',
  },

  troca: {
    id: 'troca',
    fala: [
      { quem: 'VILMA', texto: 'Última coisa, e depois eu saio da sua frente de vez.' },
      {
        quem: 'VILMA',
        texto:
          'Daqui sobe um. Sempre um. Não é regra minha nem da Nita: é do poço, e o poço não ' +
          'negocia, ele só troca.',
      },
      {
        quem: 'VILMA',
        texto:
          'Você desceu com o seu corpo, o seu nome e a sua irmã lá na frente. Vai subir com ' +
          'duas dessas três. Escolhe qual você deixa.',
      },
    ],
    pergunta:
      'Atrás dela, no fim da trilha, dá para ver alguém sentado com a cabeça baixa. A Nita anotou um risco onde ia o seu nome, e a linha ficou aberta.',
    escolhas: [
      {
        label: 'Deixar o corpo',
        certa: false,
        resultado:
          '"Bonito." Vilma balança a cabeça. "É o que todo mundo escolhe, e é o que faz subir o ' +
          'que sobe."\n\n' +
          'Ela explica com paciência, e é a paciência que dá medo: sem corpo, o que sobe com a ' +
          'sua lembrança e a sua voz é o poço usando as duas.\n\n' +
          '"Já subiu um assim este ano. Não vou deixar subir dois."',
      },
      {
        label: 'Deixar o nome',
        certa: true,
        resultado:
          'Vilma para. Depois ri — uma risada curta e feia, de quem levou onze anos para ver ' +
          'uma saída óbvia.\n\n' +
          '"O nome. Claro. A linha da Nita já está aberta, sem nome nenhum na esquerda." Ela sai ' +
          'da frente inteira, pela primeira vez.\n\n' +
          '"Sobe sem nome, menino. Vai doer de um jeito que você não espera: sua mãe vai olhar ' +
          'para você e não vai encontrar onde pendurar você dentro dela. Mas você sobe, e a sua ' +
          'irmã sobe, e a conta do poço fecha com um risco."',
      },
      {
        label: 'Deixar a irmã',
        certa: false,
        resultado:
          'Você diz, e o eco daqui embaixo repete duas vezes em vez de uma.\n\n' +
          'Vilma não arma o arco. Ela abaixa o dela e aponta para trás de você, e a coisa que ' +
          'está atrás de você já estava concordando com a sua escolha antes de você terminar de ' +
          'falar.\n\n' +
          '"Essa aí não é escolha", ela diz. "Essa aí é entrega."',
      },
    ],
    depois: 'Sobe sem nome. Dói, e passa. Quase tudo passa.',
  },
};

/** ordem em que as paradas aparecem, para a barra de progresso */
export const ORDEM = Object.keys(DESAFIOS);

// ── abertura ────────────────────────────────────────────

export const ABERTURA: Fala[] = [
  {
    quem: 'A SUA MÃE',
    texto:
      'O poço de Água Preta nunca secou. Secou o do Alto, secou o da Vargem, secou o da ' +
      'estrada. O nosso continua dando água doce e fria, no meio de um vale que virou pedra.',
  },
  {
    quem: 'A SUA MÃE',
    texto:
      'Todo inverno alguém desce a corda para limpar o fundo. Sorteio de nome no chapéu, na ' +
      'frente de todos, para ninguém dizer depois que foi arranjado.',
  },
  {
    quem: 'A SUA MÃE',
    texto:
      'A pessoa desce, demora, e sobe. Sempre sobe. Aí o povoado janta junto, ninguém pergunta ' +
      'como foi lá embaixo, e a vida segue até o inverno seguinte.',
  },
  {
    quem: 'A SUA MÃE',
    texto:
      'Este ano saiu o nome da Iara. Faz nove dias e a corda continua esticada.\n\n' +
      'Não é para você ir. Ninguém vai atrás. Foi assim que combinamos, e é assim há onze ' +
      'invernos, e olha que eu já desci uma vez.',
  },
  {
    quem: 'A SUA MÃE',
    texto:
      'Ela disse isso na porta da cozinha, de costas, mexendo panela. E continuou mexendo ' +
      'depois que você saiu.\n\n' +
      'Você levou a corda velha do celeiro. A boa está no poço, esticada, faz nove dias.',
  },
];

// ── o encontro no fundo ─────────────────────────────────

export const DESFECHO: Fala[] = [
  {
    quem: 'IARA',
    texto:
      'Não tira a venda. Escuta a minha voz e responde, mas não tira a venda, e não olha para ' +
      'trás de mim.',
  },
  {
    quem: 'IARA',
    texto:
      'Eu me amarrei no terceiro dia. Descobri que as minhas mãos estavam desamarrando o nó da ' +
      'corda sozinhas, e eu estava olhando elas fazerem isso sem nenhuma vontade de mandar ' +
      'parar. Aí eu me amarrei e vendei antes de perder a última vontade que ainda era minha.',
  },
  {
    quem: 'IARA',
    texto:
      'Não tem monstro aqui embaixo. Tem um lugar bonito. É essa a armadilha inteira: você ' +
      'chega, olha, e entende que aqui é melhor. Ninguém é levado. Todo mundo fica porque quer.',
  },
  {
    quem: 'IARA',
    texto:
      'E aí sobe alguém no seu lugar, com a sua cara, para o povoado não sentir falta. É por ' +
      'isso que a nossa mãe já desceu uma vez e nunca falou disso.',
  },
  {
    quem: 'IARA',
    texto:
      'A corda está a doze passos atrás de mim. Você me põe de pé, me vira e me empurra na ' +
      'direção dela.\n\n' +
      'Só que para me virar você vai ter que olhar para mim. E atrás de mim é o fundo.',
  },
];

// ── a última escolha ────────────────────────────────────
//
// Não tem resposta certa: são dois fins escritos, e o jogo não avisa
// qual é qual antes. É a única escolha do jogo em que a Vigia não está
// ali para corrigir.

export interface Final {
  label: string;
  titulo: string;
  texto: string;
}

export const FINAIS: Final[] = [
  {
    label: 'Fechar os olhos e virar ela pelo som da voz',
    titulo: 'DOIS SUBIRAM',
    texto:
      'Você fecha os olhos, acha o ombro dela pelo som, vira e empurra. Ela tropeça, xinga, ' +
      'acha a corda. Você sobe atrás, de olhos fechados, contando as braças.\n\n' +
      'A conta da Nita não fechou este ano. Ficou uma linha aberta com um risco na esquerda e ' +
      'nada na direita, e sua irmã diz que a Nita vai passar o inverno inteiro emburrada com ' +
      'isso.\n\n' +
      'Em Água Preta ninguém perguntou nada. Sua mãe pôs mais um prato na mesa sem comentar, e ' +
      'os vizinhos jantaram como quem não viu.\n\n' +
      'Você não tem mais nome. Respondem quando você chama, atendem quando você bate, mas ' +
      'ninguém diz o seu nome, e você já reparou que também não consegue mais dizer.\n\n' +
      'Na semana passada você foi tirar água. Debruçou no poço, e a sua cara na água demorou ' +
      'meio instante a mais para debruçar junto.\n\n' +
      'Você não desceu para conferir. Ainda não.',
  },
  {
    label: 'Abrir os olhos: é a sua irmã, você precisa ver o rosto dela',
    titulo: 'UM SUBIU',
    texto:
      'Você abre os olhos. É ela — magra, suja, com a venda torta e o queixo tremendo de frio.\n\n' +
      'E atrás dela é o fundo.\n\n' +
      'A Vilma tinha razão sobre uma coisa: não tem monstro. É bonito. É a coisa mais bonita ' +
      'que você já viu, e ela estava aqui embaixo o tempo todo, a cinquenta braças da horta da ' +
      'sua mãe, e ninguém do povoado nunca contou porque ninguém do povoado ia acreditar.\n\n' +
      'Você senta. A Iara chama seu nome umas vinte vezes. Depois para de chamar, acha a corda ' +
      'sozinha e sobe, porque ela ainda está vendada e é isso que salva ela.\n\n' +
      'A conta do poço fechou: um desceu, um subiu.\n\n' +
      'Chegou em Água Preta no fim da tarde, arrancou a venda e encontrou você esperando no ' +
      'portão, sorrindo, com o casaco de lã no meio do calor.\n\n' +
      'Ela abraçou você e não perguntou nada. É o combinado.',
  },
];
